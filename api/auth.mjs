// File: api/auth.mjs
import { kv } from '@vercel/kv';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = z.object({
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名不能超过20个字符'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

const UsernameCheckSchema = z.string().min(3).max(20);

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

async function handlePost(req, res) {
    // Vercel Dev Serverless functions populate req.body automatically
    const body = req.body; 
    
    const validation = UserSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({ message: '输入无效', errors: validation.error.errors });
    }

    const { username, password } = validation.data;
    const userKey = `user:${username}`;
    
    const existingUser = await kv.get(userKey);

    if (existingUser) {
      const passwordMatch = await bcrypt.compare(password, existingUser.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ message: '密码错误' });
      }
    } else {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await kv.set(userKey, { username, passwordHash });
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET 环境变量未设置！');
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ message: existingUser ? '登录成功' : '注册并登录成功', token });
}

async function handleGet(req, res) {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const username = searchParams.get('username');

    try {
        UsernameCheckSchema.parse(username);
    } catch (e) {
        return res.status(400).json({ exists: false, message: '用户名格式无效' });
    }
    
    const userKey = `user:${username}`;
    const userExists = await kv.exists(userKey);

    return res.status(200).json({ exists: userExists > 0 });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      await handlePost(req, res);
    } else if (req.method === 'GET') {
      await handleGet(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ message: error.message || '服务器内部错误' });
  }
}