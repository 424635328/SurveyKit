// /api/upload-survey.mjs
import { kv } from '@vercel/kv';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

const SurveyUploadSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过100个字符"),
  // questions 现在是 JSON 字符串，在解析后验证
  questionsJSON: z.string().min(2, "问卷内容不能为空"),
});

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不支持' });
  }

  const user = authenticate(req);
  if (!user || !user.username) {
    return res.status(401).json({ message: '未经授权' });
  }

  try {
    const body = req.body;
    const validation = SurveyUploadSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({ message: '输入数据无效', errors: validation.error.errors });
    }
    
    const { title, questionsJSON } = validation.data;
    
    let questions;
    try {
        questions = JSON.parse(questionsJSON);
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("JSON 必须是一个非空数组。");
        }
    } catch (e) {
        return res.status(400).json({ message: '无效的JSON格式。' });
    }
    
    const surveyId = `survey_${nanoid()}`;
    const now = new Date().toISOString();

    const surveyData = {
      id: surveyId,
      title: title,
      questions: questions,
      owner: user.username,
      createdAt: now,
      submissionCount: 0,
    };
    
    const pipeline = kv.pipeline();
    pipeline.set(surveyId, surveyData);
    pipeline.sadd(`user:${user.username}:surveys`, surveyId);
    await pipeline.exec();

    return res.status(201).json({ message: '问卷已成功保存！', survey: surveyData });

  } catch (error) {
    console.error('Upload Survey API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}