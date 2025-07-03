import { kv } from '@vercel/kv';
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
            throw new Error('JWT_SECRET is not set on the server.');
        }
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return null;
    }
}

async function getSurveys(username) {
    const surveyIds = await kv.smembers(`user:${username}:surveys`);
    if (!surveyIds || surveyIds.length === 0) return [];
    
    if (surveyIds.length > 0) {
        const surveysRaw = await kv.mget(...surveyIds);
        return surveysRaw.filter(Boolean).map(s => ({
            id: s.id,
            title: s.title || '无标题问卷',
            createdAt: s.createdAt,
            submissionCount: s.submissionCount || 0
        }));
    }
    return [];
}

async function deleteSurvey(username, surveyId) {
    const isOwner = await kv.sismember(`user:${username}:surveys`, surveyId);
    if (!isOwner) {
        throw new Error("权限不足");
    }
    await kv.del(surveyId); 
    await kv.srem(`user:${username}:surveys`, surveyId);
    await kv.del(`survey_answers:${surveyId}`);
}

export default async function handler(req, res) {
  const user = authenticate(req);
  if (!user) {
    return res.status(401).json({ message: '未经授权' });
  }

  try {
    if (req.method === 'GET') {
        const surveys = await getSurveys(user.username);
        return res.status(200).json(surveys);
    } else if (req.method === 'DELETE') {
        const body = req.body;
        const { surveyId } = body;
        if (!surveyId) {
            return res.status(400).json({ message: '缺少 surveyId' });
        }
        await deleteSurvey(user.username, surveyId);
        return res.status(200).json({ message: '问卷已删除' });
    } else {
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('问卷管理 API 错误:', error);
    return res.status(500).json({ message: error.message || '服务器内部错误' });
  }
}