// api/save.mjs

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { randomUUID } from "crypto";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:survey",
});

// [安全修复] 增强了Zod校验规则
// 之前使用 .catchall(z.any()) 过于宽松，无法防止恶意或错误格式的数据。
// 现在使用 .catchall(z.string(...)) 确保所有提交的答案都必须是字符串，
// 并增加了最大长度限制，防止数据污染和潜在的注入风险。
const SurveySchema = z
  .object({
    q_email: z.string().email({ message: "邮箱格式不正确" }).optional(),
  })
  .catchall(
    z
      .string({ invalid_type_error: "答案必须是文本格式" })
      .max(5000, { message: "答案内容过长" }) // 限制单个答案长度为5000字符
      .optional()
  );

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  try {
    const ip = request.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return response
        .status(429)
        .json({ message: "请求过于频繁，请稍后再试。" });
    }
  } catch (error) {
    console.error("速率限制器出错:", error);
  }

  try {
    const rawData = request.body;

    if (!rawData || Object.keys(rawData).length === 0) {
      return response.status(400).json({ message: "请求内容不能为空" });
    }

    const validationResult = SurveySchema.safeParse(rawData);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const errorMessage = `字段 '${firstError.path.join(".")}' 不合法: ${
        firstError.message
      }`;
      console.warn("数据校验失败:", errorMessage, "原始数据:", rawData);
      return response.status(400).json({ message: errorMessage });
    }

    const surveyData = validationResult.data;
    const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const accessToken = randomUUID();
    
    const userEmail = surveyData.q_email || null; 

    await kv.hset(`survey:${surveyId}`, {
        data: JSON.stringify(surveyData),
        token: accessToken,
        userEmail: userEmail,
    });

    if (userEmail) {
        await kv.lpush(`email_to_survey_ids:${userEmail.toLowerCase()}`, surveyId);
        await kv.ltrim(`email_to_survey_ids:${userEmail.toLowerCase()}`, 0, 4); 
    }

    return response.status(200).json({
      success: true,
      message: "数据已保存",
      id: surveyId,
      token: accessToken,
    });
  } catch (error) {
    console.error("保存问卷时发生未知错误:", error);
    return response
      .status(500)
      .json({ message: "服务器内部错误，请联系管理员" });
  }
}