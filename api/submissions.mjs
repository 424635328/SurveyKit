// api/submissions.mjs (示例代码 - 您需要根据您的KV存储逻辑来实现)
import { kv } from '@vercel/kv';
import { z } from 'zod';
// import jwt from 'jsonwebtoken'; // 提交问卷通常不需要用户认证

// 定义提交数据的Zod Schema
const SubmissionSchema = z.object({
  surveyId: z.string().startsWith('survey_', { message: "无效的问卷ID格式" }),
  // answers 是一个对象，键是问题ID，值是用户回答
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])), // 答案可以是多种类型
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: '方法不支持' });
  }

  // 问卷提交通常不需要身份验证，因为任何人都可以填写问卷。
  // 如果需要，可以在此处添加认证逻辑。

  try {
    const body = req.body;
    const validation = SubmissionSchema.safeParse(body);

    if (!validation.success) {
      console.error('Submission Data Validation Error:', validation.error.errors);
      return res.status(400).json({ message: '提交数据无效', errors: validation.error.errors });
    }

    const { surveyId, answers } = validation.data;
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // 简单的唯一ID

    const submissionData = {
      id: submissionId,
      surveyId: surveyId,
      submittedAt: new Date().toISOString(),
      answers: answers,
      // 可以添加 IP 地址、User-Agent 等信息用于防刷或统计
    };

    const pipeline = kv.pipeline();
    // 将提交数据保存到 KV，例如键为 `submission:${submissionId}`
    pipeline.set(`submission:${submissionId}`, submissionData);
    // 同时，将这个提交ID添加到对应问卷的提交列表Set中
    // 这样在查看问卷结果时，可以方便地获取所有提交
    pipeline.sadd(`survey:${surveyId}:submissions`, submissionId);

    // 更新问卷的提交计数 (假设问卷数据中有一个 submissionCount 字段)
    // 首先获取当前问卷数据
    const survey = await kv.get(surveyId);
    if (survey) {
        // Increment submissionCount (ensure it's a number)
        survey.submissionCount = (survey.submissionCount || 0) + 1;
        pipeline.set(surveyId, survey); // Update the survey object in KV
    } else {
        // This scenario means a submission was made for a non-existent survey, which is odd.
        console.warn(`Submission received for non-existent survey ID: ${surveyId}`);
    }

    await pipeline.exec();

    return res.status(201).json({ message: '问卷提交成功！', submissionId: submissionId });

  } catch (error) {
    console.error('Submit Survey API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}