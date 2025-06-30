// api/recover-link.mjs (完整修改版)

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL
const YOUR_APP_DOMAIN = process.env.VERCEL_URL || "https://survey-kit.vercel.app";

const emailRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  prefix: "ratelimit:email_recovery",
});

const RequestSchema = z.object({
  email: z.string().email({ message: "无效的邮箱格式" }).optional(),
  surveyId: z.string().optional(),
}).refine(data => data.email || data.surveyId, {
    message: "必须提供邮箱或问卷ID"
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  if (!RESEND_API_KEY) {
    return response.status(500).json({ message: "邮件服务API密钥未配置。" });
  }

  try {
    const ip = request.ip ?? "127.0.0.1";
    const { success, remaining } = await emailRatelimit.limit(ip);

    if (!success) {
      return response.status(429).json({ message: `请求过于频繁，请稍后再试。剩余次数：${remaining}` });
    }
  } catch (error) {
    console.error("邮件速率限制器出错:", error);
  }

  try {
    const validationResult = RequestSchema.safeParse(request.body);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }

    const { email: userEmailInput, surveyId: userSurveyIdInput } = validationResult.data;
    
    let targetSurveyId = null;
    let storedToken = null;
    let storedUserEmail = null;

    if (userSurveyIdInput) {
        // 优先通过问卷ID查找
        const surveyRecord = await kv.hgetall(`survey:${userSurveyIdInput}`);
        if (surveyRecord && surveyRecord.data && surveyRecord.token) {
            targetSurveyId = userSurveyIdInput;
            storedToken = surveyRecord.token;
            storedUserEmail = surveyRecord.userEmail;
        }
    } else if (userEmailInput) {
        // 如果只提供了邮箱，通过邮箱索引查找最新的问卷ID
        // 注意：这里假设通过 LPUSH 存储的第一个（最新）ID是用户想要的
        const surveyIds = await kv.lrange(`email_to_survey_ids:${userEmailInput.toLowerCase()}`, 0, 0);
        if (surveyIds && surveyIds.length > 0) {
            const latestSurveyId = surveyIds[0];
            const surveyRecord = await kv.hgetall(`survey:${latestSurveyId}`);
            if (surveyRecord && surveyRecord.data && surveyRecord.token) {
                targetSurveyId = latestSurveyId;
                storedToken = surveyRecord.token;
                storedUserEmail = surveyRecord.userEmail; // 从问卷数据中获取邮箱
            }
        }
    }

    if (!targetSurveyId || !storedToken || !storedUserEmail) {
      return response.status(404).json({ message: "未找到匹配的问卷，请检查您输入的ID或邮箱是否正确。" });
    }

    // 如果用户在请求中提供了邮箱，而存储的邮箱不匹配，则拒绝
    if (userEmailInput && storedUserEmail.toLowerCase() !== userEmailInput.toLowerCase()) {
        return response.status(400).json({ message: "输入的邮箱与问卷记录不符。" });
    }


    const recoveryLink = `${YOUR_APP_DOMAIN}/result.html?id=${targetSurveyId}&token=${storedToken}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: storedUserEmail,
        subject: "你的 SurveyKit 问卷专属链接",
        text: `你好！\n\n这是你 SurveyKit 问卷的专属链接，请点击访问：\n\n${recoveryLink}\n\n请妥善保管此链接，不要分享给他人。\n\n此邮件由 SurveyKit 自动发送。`,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.json();
      console.error("Resend API 错误:", resendResponse.status, errorBody);
      throw new Error(errorBody.message || "邮件发送失败，请稍后再试。");
    }

    return response.status(200).json({ success: true, message: `专属链接已发送至您的邮箱 (${storedUserEmail})！请查收。` });

  } catch (error) {
    console.error("找回链接时发生错误:", error);
    return response.status(500).json({ message: error.message || "服务器内部错误，请稍后再试。" });
  }
}