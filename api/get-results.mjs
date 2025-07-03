// /api/get-results.mjs
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try {
        if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export default async function handler(req, res) {
  const user = authenticate(req);
  if (!user || !user.username) {
    return res.status(401).json({ message: '未经授权' });
  }

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const surveyId = searchParams.get('id');

    if (!surveyId) {
      return res.status(400).json({ message: '缺少问卷ID' });
    }
    
    // 验证用户是否有权查看此问卷的结果
    const surveyData = await kv.get(surveyId);
    if (!surveyData || surveyData.owner !== user.username) {
        return res.status(403).json({ message: '权限不足或问卷不存在' });
    }

    // 获取所有回答
    const answerKeys = await kv.keys(`answers:${surveyId}:*`);
    const submissions = answerKeys.length > 0 ? await kv.mget(...answerKeys) : [];

    const responsePayload = {
        title: surveyData.title,
        submissions: submissions.map(ans => ans.answers)
    };

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Get Results API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}