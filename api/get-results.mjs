// api/get-results.mjs
import { kv } from '@vercel/kv';
import { authenticate } from '../utils/auth.js';
import { z } from 'zod';

// 定义 Zod Schema 来验证传入的查询参数
const QuerySchema = z.object({
  id: z.string().min(1, "问卷ID不能为空").startsWith('survey_', { message: "无效的问卷ID格式" }),
});

export default async function handler(req, res) {
  // 只允许 GET 方法
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: '方法不支持' });
  }

  // 身份验证
  const user = authenticate(req);
  if (!user || !user.username) {
    return res.status(401).json({ message: '未经授权' });
  }

  try {
    // 验证 URL 查询参数
    const validation = QuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: '请求参数无效', errors: validation.error.errors });
    }
    const surveyId = validation.data.id;

    // 验证用户是否有权查看此问卷的结果
    const surveyData = await kv.get(surveyId);
    // 确保问卷存在且属于当前登录用户
    if (!surveyData || surveyData.owner !== user.username) {
        return res.status(404).json({ message: '问卷未找到或您没有权限查看。' });
    }

    // 1. 根据 submissions.mjs 的存储方式，首先获取所有提交的 ID
    // KV Set 的键是 `survey:${surveyId}:submissions`
    const submissionIds = await kv.smembers(`survey:${surveyId}:submissions`);

    let submissions = [];
    if (submissionIds && submissionIds.length > 0) {
        // 2. 构造实际存储答案的键，并批量获取数据
        // KV Hash 的键是 `submission:${submissionId}`
        const submissionKeys = submissionIds.map(id => `submission:${id}`);
        const rawSubmissions = await kv.mget(...submissionKeys);
        
        // 过滤掉 null 值（可能有些提交在 KV 中已不存在，例如过期或被删除）
        submissions = rawSubmissions.filter(sub => sub !== null).map(sub => {
            // 返回的每个 sub 已经是完整的提交对象，其中包含 answers 字段
            return {
                id: sub.id, // 提交本身的ID
                submittedAt: sub.submittedAt,
                answers: sub.answers // 提交的具体答案对象
            };
        });
    }

    // 前端 results.js 期望一个 { submissions: [...] } 的结构
    return res.status(200).json({ submissions: submissions });

  } catch (error) {
    console.error('Get Results API Error:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}