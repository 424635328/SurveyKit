// api/recover-link.mjs (完整修改版 - 使用 Resend SDK)

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { Resend } from 'resend'; // 确保引入 Resend SDK

// --- 环境变量 ---
const RESEND_API_KEY = process.env.RESEND_API_KEY; // Resend API Key
const SENDER_EMAIL = process.env.SENDER_EMAIL;     // 已验证的发送邮箱地址 (e.g., 'SurveyKit <noreply@yourdomain.com>')
const YOUR_APP_DOMAIN = process.env.VERCEL_URL || "https://survey-kit.vercel.app"; // 你的应用域名

// --- 初始化 Resend 客户端 ---
const resend = new Resend(RESEND_API_KEY);

// --- 初始化速率限制器 ---
// 限制每个IP每分钟最多请求2次邮件找回
const emailRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  prefix: "ratelimit:email_recovery", // 独立的key前缀，防止与其他速率限制器冲突
});

// --- 输入参数校验 Schema ---
const RequestSchema = z.object({
  email: z.string().email({ message: "无效的邮箱格式" }).optional(),
  surveyId: z.string().min(1, { message: "问卷ID不能为空" }).optional(), // 问卷ID至少一个字符
}).refine(data => data.email || data.surveyId, {
    message: "必须提供邮箱或问卷ID"
});

// --- Serverless Function Handler ---
export default async function handler(request, response) {
  // 1. 检查请求方法
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  // 2. 检查API密钥是否配置
  // 注意：如果使用Resend SDK，它内部也会检查，但这里先检查更明确
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY 环境变量未配置.");
    return response.status(500).json({ message: "邮件服务API密钥未配置。" });
  }

   // 3. 检查发送邮箱是否配置 (新的检查)
   if (!SENDER_EMAIL || !SENDER_EMAIL.includes('@')) {
       console.error("SENDER_EMAIL 环境变量未配置或格式不正确.");
       return response.status(500).json({ message: "发送邮箱地址未配置或不正确。" });
   }


  try {
    // 4. 执行速率限制检查
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress || '127.0.0.1'; // 获取真实IP
    const { success, limit, reset } = await emailRatelimit.limit(ip);

    response.headers.set('X-RateLimit-Limit', limit);
    response.headers.set('X-RateLimit-Remaining', success ? 0 : 1); // 如果成功，剩余为0；如果失败，表示已无剩余
    response.headers.set('X-RateLimit-Reset', reset); // 下次重置的时间戳

    if (!success) {
      // 速率限制触发，等待到 reset 时间
      const secondsToWait = Math.ceil((reset - Date.now()) / 1000);
      return response.status(429).json({ 
          message: `请求过于频繁，请在 ${secondsToWait} 秒后重试。`,
          retryAfter: secondsToWait
      });
    }
  } catch (error) {
    console.error("邮件速率限制器出错:", error);
    // 速率限制器出错不应阻止请求，但可以返回警告或使用默认通过策略
    // 这里选择继续，但记录错误
  }

  try {
    // 5. 校验请求参数
    const validationResult = RequestSchema.safeParse(request.body);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }

    const { email: userEmailInput, surveyId: userSurveyIdInput } = validationResult.data;
    
    // --- 6. 查找问卷记录 ---
    let targetSurveyId = null;
    let storedToken = null;
    let storedUserEmail = null;

    if (userSurveyIdInput) {
        // 通过问卷ID查找
        const surveyRecord = await kv.hgetall(`survey:${userSurveyIdInput}`);
        // 检查记录是否存在且包含必要字段
        if (surveyRecord && surveyRecord.token && surveyRecord.userEmail) {
            targetSurveyId = userSurveyIdInput;
            storedToken = surveyRecord.token;
            storedUserEmail = surveyRecord.userEmail; 
        } else {
             console.warn(`未找到或记录不完整 survey:${userSurveyIdInput}`);
        }
    } else if (userEmailInput) {
        // 通过邮箱查找最新的问卷ID (假设列表第一个是最新的)
        const emailKey = `email_to_survey_ids:${userEmailInput.toLowerCase()}`;
        const surveyIds = await kv.lrange(emailKey, 0, 0); // 只取最新的一个ID
        
        if (surveyIds && surveyIds.length > 0) {
            const latestSurveyId = surveyIds[0];
            const surveyRecord = await kv.hgetall(`survey:${latestSurveyId}`);
             // 检查记录是否存在且包含必要字段
            if (surveyRecord && surveyRecord.token && surveyRecord.userEmail) {
                targetSurveyId = latestSurveyId;
                storedToken = surveyRecord.token;
                storedUserEmail = surveyRecord.userEmail; // 从问卷数据中获取邮箱
            } else {
                console.warn(`通过邮箱 ${userEmailInput} 找到ID ${latestSurveyId}，但记录不完整。`);
            }
        } else {
             console.warn(`未找到与邮箱 ${userEmailInput} 关联的问卷ID列表。`);
        }
    }

    // 检查是否成功找到问卷记录及其关联信息
    if (!targetSurveyId || !storedToken || !storedUserEmail) {
        console.log(`找回失败: ID=${userSurveyIdInput}, Email=${userEmailInput}. 未找到匹配记录.`);
        return response.status(404).json({ message: "未找到匹配的问卷，请检查您输入的ID或邮箱是否正确。" });
    }

    // 安全检查：如果用户提供了邮箱，验证是否与存储的邮箱匹配
    if (userEmailInput && storedUserEmail.toLowerCase() !== userEmailInput.toLowerCase()) {
         console.warn(`找回失败: ID=${targetSurveyId}. 提供的邮箱 (${userEmailInput}) 与存储邮箱 (${storedUserEmail}) 不匹配.`);
        return response.status(400).json({ message: "输入的邮箱与问卷记录不符。" });
    }


    // --- 7. 生成恢复链接 ---
    const recoveryLink = `${YOUR_APP_DOMAIN}/result.html?id=${targetSurveyId}&token=${storedToken}`;
    
    console.log(`为问卷ID ${targetSurveyId} (Email: ${storedUserEmail}) 生成恢复链接: ${recoveryLink}`);

    // --- 8. 使用 Resend SDK 发送邮件 ---
    try {
        const { data, error } = await resend.emails.send({
            from: SENDER_EMAIL, 
            to: storedUserEmail,
            subject: "你的 SurveyKit 问卷专属链接",
            text: `你好！\n\n这是你 SurveyKit 问卷的专属链接，请点击访问：\n\n${recoveryLink}\n\n请妥善保管此链接，不要分享给他人。\n\n此邮件由 SurveyKit 自动发送。`,
            // 可以选择添加 HTML 版本
            html: `<p>你好！</p><p>这是你 SurveyKit 问卷的专属链接，请点击访问：</p><p><a href="${recoveryLink}">${recoveryLink}</a></p><p>请妥善保管此链接，不要分享给他人。</p><p>此邮件由 SurveyKit 自动发送。</p>`,
        });

        if (error) {
            console.error("使用 Resend SDK 发送邮件失败:", error);
            // Resend SDK 的 error 对象通常包含详细信息
            throw new Error(error.message || "邮件发送失败，请稍后再试。");
        }

        console.log(`成功发送邮件至 ${storedUserEmail}. Resend Data:`, data);
        return response.status(200).json({ success: true, message: `专属链接已发送至您的邮箱 (${storedUserEmail})！请查收。` });

    } catch (emailError) {
        console.error("邮件发送过程出错:", emailError);
        // 捕获邮件发送时的错误，并返回给用户
        return response.status(500).json({ message: emailError.message || "发送邮件时发生错误，请稍后再试。" });
    }

  } catch (error) {
    console.error("处理找回链接请求时发生未知错误:", error);
    // 捕获处理逻辑中的其他错误
    return response.status(500).json({ message: error.message || "服务器内部错误，请稍后再试。" });
  }
}