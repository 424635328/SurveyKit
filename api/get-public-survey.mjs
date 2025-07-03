// /api/get-public-survey.mjs
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const surveyId = searchParams.get('sid');

    if (!surveyId) {
      return res.status(400).json({ message: '缺少问卷ID' });
    }

    const surveyData = await kv.get(surveyId);

    if (!surveyData) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    // 只返回公开的、安全的部分
    const publicSurveyData = {
      title: surveyData.title,
      questions: surveyData.questions
    };

    // 设置缓存头，提高性能
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(publicSurveyData);

  } catch (error) {
    console.error('Get Public Survey API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}