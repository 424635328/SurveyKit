// api/survey-details.mjs

import { kv } from '@vercel/kv';
import { z } from 'zod';
import { authenticate } from '../utils/auth.js';

const QuerySchema = z.object({
  id: z.string().min(1, '问卷ID不能为空').startsWith('survey_', { message: '无效的问卷ID格式' }),
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: '方法不支持' });
  }

  const user = authenticate(req);
  if (!user || !user.username) {
    return res.status(401).json({ message: '未经授权' });
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

    if (surveyData.owner && surveyData.owner !== user.username) {
      return res.status(403).json({ message: '无权访问此问卷' });
    }

    return res.status(200).json(surveyData);

  } catch (error) {
    console.error('API /api/survey-details.mjs 发生内部错误:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}