// api/survey-details.mjs

import { kv } from '@vercel/kv';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET not set');
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

const QuerySchema = z.object({
  id: z.string().min(1, "问卷ID不能为空").startsWith('survey_', { message: "无效的问卷ID格式" }),
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: '方法不支持' });
  }

  try {
    const validation = QuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        message: '请求参数无效',
        errors: validation.error.errors
      });
    }

    const { id: surveyId } = validation.data;

    const surveyData = await kv.get(surveyId);

    if (!surveyData) {
      return res.status(404).json({ message: '问卷未找到' });
    }

    // 注意：此API现在是公开的，不对问卷所有者进行验证。
    // 任何拥有有效问卷ID的人都可以获取问卷详情。
    // 如果您需要保护某些问卷不被公开访问，请在问卷数据中添加一个“is_public”字段并在此处进行检查。

    return res.status(200).json(surveyData);

  } catch (error) {
    console.error('API /api/survey-details.mjs 发生内部错误:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}