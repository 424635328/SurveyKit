// api/submissions.mjs
import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:submissions",
});

const SubmissionSchema = z.object({
  surveyId: z.string().startsWith('survey_', { message: "无效的问卷ID格式" }),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: '方法不支持' });
  }

  try {
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({ message: '请求过于频繁，请稍后再试。' });
    }
  } catch (e) {
    console.error('Rate limiter error:', e);
  }

  try {
    const body = req.body;
    const validation = SubmissionSchema.safeParse(body);

    if (!validation.success) {
      console.error('Submission Data Validation Error:', validation.error.errors);
      return res.status(400).json({ message: '提交数据无效', errors: validation.error.errors });
    }

    const { surveyId, answers } = validation.data;
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const submissionData = {
      id: submissionId,
      surveyId: surveyId,
      submittedAt: new Date().toISOString(),
      answers: answers,
    };

    const pipeline = kv.pipeline();
    pipeline.set(`submission:${submissionId}`, submissionData);
    pipeline.sadd(`survey:${surveyId}:submissions`, submissionId);

    const survey = await kv.get(surveyId);
    if (survey) {
        survey.submissionCount = (survey.submissionCount || 0) + 1;
        pipeline.set(surveyId, survey);
    } else {
        console.warn(`Submission received for non-existent survey ID: ${surveyId}`);
    }

    await pipeline.exec();

    return res.status(201).json({ message: '问卷提交成功！', submissionId: submissionId });

  } catch (error) {
    console.error('Submit Survey API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}