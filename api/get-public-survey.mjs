// /api/get-public-survey.mjs
import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "ratelimit:public_survey",
});

export default async function handler(req, res) {
  try {
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? '127.0.0.1';
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return res.status(429).json({ message: '请求过于频繁，请稍后再试。' });
      }
    } catch (e) {
      console.error('Rate limiter error:', e);
    }

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const surveyId = searchParams.get('sid');

    if (!surveyId) {
      return res.status(400).json({ message: '缺少问卷ID' });
    }

    const surveyData = await kv.get(surveyId);

    if (!surveyData) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    const publicSurveyData = {
      title: surveyData.title,
      questions: surveyData.questions
    };

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(publicSurveyData);

  } catch (error) {
    console.error('Get Public Survey API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}