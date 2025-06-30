// api/recover-link.mjs

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { Resend } from 'resend';

// --- 配置常量 ---
// 从 Vercel 环境变量中获取密钥和配置
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const YOUR_APP_DOMAIN = "https://survey-kit.vercel.app";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// --- 服务初始化 ---
// 初始化 Resend 邮件服务客户端
const resend = new Resend(RESEND_API_KEY);

// 初始化速率限制器 (基于 Vercel KV)
const emailRatelimit = new Ratelimit({
  redis: kv,
  // 限制：每个标识符在 10 分钟内最多 5 次请求
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ratelimit:email_recovery",
});

// --- 请求体结构验证 (使用 Zod) ---
const RequestSchema = z.object({
  email: z.string().email({ message: "无效的邮箱格式" }).optional(),
  surveyId: z.string().min(1, { message: "问卷ID不能为空" }).optional(),
  captchaToken: z.string().min(1, { message: "必须提供人机验证令牌" }),
}).refine(data => data.email || data.surveyId, {
    message: "必须提供邮箱或问卷ID"
});

/**
 * 创建用于找回链接的邮件模板 (HTML 和纯文本)
 * @param {string} recoveryLink - 生成的专属找回链接
 * @param {string} surveyId - 对应的问卷ID
 * @returns {{emailHtml: string, emailText: string}}
 */
function createEmailTemplate(recoveryLink, surveyId) {
    const preheaderText = "点击这里，安全访问您的专属问卷结果。";

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, 'Microsoft Yahei', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .header { background-color: #4f46e5; padding: 24px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; }
            .content { padding: 32px; }
            .content p { line-height: 1.7; margin: 0 0 16px; font-size: 16px; }
            .content .highlight { color: #1e293b; font-weight: 500; }
            .button-wrapper { text-align: center; margin: 32px 0; }
            .button { display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 500; transition: background-color 0.3s; }
            .button:hover { background-color: #4f46e5; }
            .copy-info { text-align: center; font-size: 14px; color: #64748b; margin-top: 24px; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
            .footer p { margin: 0 0 8px; }
            .preheader { display: none; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; }
        </style>
    </head>
    <body>
        <span class="preheader">${preheaderText}</span>
        <div class="container">
            <div class="header">
                <h1>SurveyKit 问卷找回</h1>
            </div>
            <div class="content">
                <p class="highlight">您好！</p>
                <p>我们收到了一个找回您 SurveyKit 问卷结果的请求。请点击下方的按钮，即可安全地访问您的专属问卷结果页。</p>
                <div class="button-wrapper">
                    <a href="${recoveryLink}" class="button">查看我的问卷结果</a>
                </div>
                <p class="copy-info">
                    如果按钮无法点击，您可以返回问卷结果页，使用“复制链接”功能进行分享。<br>您的问卷ID是: <strong>${surveyId}</strong>
                </p>
                <p style="margin-top: 24px;">为了您的信息安全，<strong style="color: #be123c;">请不要将此链接分享给他人</strong>。此链接是访问您问卷结果的唯一凭证。</p>
                <p>如果您没有请求找回问卷，请忽略此邮件，您的账户是安全的。</p>
            </div>
            <div class="footer">
                <p>此邮件由 SurveyKit 自动发送，请勿直接回复。</p>
                <p>© ${new Date().getFullYear()} SurveyKit. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const emailText = `
    ${preheaderText}

    您好！
    我们收到了一个找回您 SurveyKit 问卷结果的请求。请访问下方的链接查看您的专属问卷结果。
    访问链接: ${recoveryLink}
    为了您的信息安全，请不要将此链接分享给他人。
    如果您没有请求找回问卷，请忽略此邮件。
    ---
    此邮件由 SurveyKit 自动发送。
    © ${new Date().getFullYear()} SurveyKit.
    `;
    
    return { emailHtml, emailText };
}


/**
 * 验证 Cloudflare Turnstile 令牌
 * @param {string} token - 从客户端获取的 'cf-turnstile-response' 令牌
 * @param {string} ip - 用户的IP地址
 * @returns {Promise<{success: boolean, errorCodes: string[]}>} - 返回包含成功状态和错误码的对象
 */
async function verifyTurnstile(token, ip) {
    const secretKeyPreview = `${TURNSTILE_SECRET_KEY?.substring(0, 4)}...${TURNSTILE_SECRET_KEY?.slice(-4)}`;
    console.log(`[DEBUG] verifyTurnstile: Verifying with secret key preview: ${secretKeyPreview}`);
    
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    formData.append('remoteip', ip);
    
    console.log(`[DEBUG] verifyTurnstile: Sending request to Cloudflare with remoteip: ${ip}`);

    try {
        const response = await fetch(verificationUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error(`[ERROR] verifyTurnstile: Cloudflare server responded with status ${response.status}.`);
            const responseBody = await response.text();
            console.error(`[ERROR] verifyTurnstile: Response body: ${responseBody}`);
            return { success: false, errorCodes: [`http-status-${response.status}`] };
        }

        const data = await response.json();
        console.log("[INFO] verifyTurnstile: Received verification response from Cloudflare:", JSON.stringify(data, null, 2));
        
        if (data.success) {
            return { success: true, errorCodes: [] };
        } else {
            console.warn(`[WARN] verifyTurnstile: Verification failed with error codes: ${data['error-codes']?.join(', ')}`);
            return { success: false, errorCodes: data['error-codes'] || [] };
        }

    } catch (error) {
        console.error("[ERROR] verifyTurnstile: An exception occurred during fetch.", error);
        return { success: false, errorCodes: ['fetch-exception'] };
    }
}


/**
 * Vercel Edge Function 的主处理函数
 * @param {import('@vercel/node').VercelRequest} request
 * @param {import('@vercel/node').VercelResponse} response
 */
export default async function handler(request, response) {
  console.log(`\n[${new Date().toISOString()}] --- New Request to recover-link ---`);
  
  // --- 0. 初始检查 ---
  if (request.method !== "POST") {
    console.log(`[REJECTED] Invalid method: ${request.method}`);
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  if (!RESEND_API_KEY || !SENDER_EMAIL || !TURNSTILE_SECRET_KEY) {
    console.error("[FATAL] Critical environment variables are not configured.");
    console.error(`[DEBUG] RESEND_API_KEY exists: ${!!RESEND_API_KEY}`);
    console.error(`[DEBUG] SENDER_EMAIL exists: ${!!SENDER_EMAIL}`);
    console.error(`[DEBUG] TURNSTILE_SECRET_KEY exists: ${!!TURNSTILE_SECRET_KEY}`);
    return response.status(500).json({ message: "服务未正确配置。" });
  }

  try {
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress || '127.0.0.1';
    console.log(`[INFO] Request received from IP: ${ip}`);
    
    // --- 1. 验证请求体 ---
    console.log("[STEP 1/5] Validating request body...");
    const validationResult = RequestSchema.safeParse(request.body);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        console.warn(`[REJECTED] Invalid request body: ${firstError.message}. Full body:`, JSON.stringify(request.body));
        return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }
    
    const { captchaToken, email: userEmailInput, surveyId: userSurveyIdInput } = validationResult.data;
    console.log(`[SUCCESS] Request body is valid. Email: ${userEmailInput || 'N/A'}, SurveyID: ${userSurveyIdInput || 'N/A'}`);

    // --- 2. 人机验证 ---
    console.log("[STEP 2/5] Performing Turnstile verification...");
    const verificationResult = await verifyTurnstile(captchaToken, ip);
    if (!verificationResult.success) {
        console.warn(`[REJECTED] Turnstile verification failed for IP: ${ip}. Error Codes: ${verificationResult.errorCodes.join(', ')}`);
        return response.status(403).json({ message: "人机验证失败，请刷新重试。" });
    }
    console.log(`[SUCCESS] Turnstile verification passed.`);

    // --- 3. 速率限制 ---
    console.log("[STEP 3/5] Checking rate limit...");
    const identifier = userEmailInput?.toLowerCase() || userSurveyIdInput || ip;
    const { success, limit, reset, remaining } = await emailRatelimit.limit(identifier);
    if (!success) {
      const secondsToWait = Math.ceil((reset - Date.now()) / 1000);
      console.warn(`[REJECTED] Rate limit exceeded for identifier: ${identifier}. Retry after ${secondsToWait}s.`);
      return response.status(429).json({ 
          message: `请求过于频繁，请在 ${secondsToWait} 秒后重试。`,
          retryAfter: secondsToWait
      });
    }
    console.log(`[SUCCESS] Rate limit check passed for identifier: ${identifier}. Remaining: ${remaining}/${limit}`);
    
    // --- 4. 查找问卷记录 ---
    console.log("[STEP 4/5] Searching for survey record in database...");
    let targetSurveyId = null;
    let storedToken = null;
    let storedUserEmail = null;
    let isMatch = false;

    if (userSurveyIdInput) {
        console.log(`[INFO] Searching by SurveyID: ${userSurveyIdInput}`);
        const surveyRecord = await kv.hgetall(`survey:${userSurveyIdInput}`);
        if (surveyRecord && surveyRecord.token && surveyRecord.userEmail) {
            if (userEmailInput) {
                if (surveyRecord.userEmail.toLowerCase() === userEmailInput.toLowerCase()) {
                    isMatch = true;
                }
            } else {
                isMatch = true;
            }

            if (isMatch) {
                targetSurveyId = userSurveyIdInput;
                storedToken = surveyRecord.token;
                storedUserEmail = surveyRecord.userEmail;
            }
        }
    } else if (userEmailInput) {
        console.log(`[INFO] Searching by Email: ${userEmailInput}`);
        const emailKey = `email_to_survey_ids:${userEmailInput.toLowerCase()}`;
        const surveyIds = await kv.lrange(emailKey, 0, 0);
        if (surveyIds && surveyIds.length > 0) {
            const latestSurveyId = surveyIds[0];
            console.log(`[INFO] Found latest survey ID for email: ${latestSurveyId}`);
            const surveyRecord = await kv.hgetall(`survey:${latestSurveyId}`);
            if (surveyRecord && surveyRecord.token && surveyRecord.userEmail) {
                targetSurveyId = latestSurveyId;
                storedToken = surveyRecord.token;
                storedUserEmail = surveyRecord.userEmail;
                isMatch = true;
            }
        }
    }

    if (!isMatch) {
        console.warn(`[REJECTED] No matching record found for input. Email: ${userEmailInput || 'N/A'}, SurveyID: ${userSurveyIdInput || 'N/A'}`);
        return response.status(404).json({ message: "无法找到匹配的记录。请仔细检查您输入的问卷ID或邮箱地址。" });
    }
    console.log(`[SUCCESS] Record found. Target SurveyID: ${targetSurveyId}, Email: ${storedUserEmail}`);

    // --- 5. 发送邮件 ---
    console.log("[STEP 5/5] Sending recovery email...");
    const recoveryLink = `${YOUR_APP_DOMAIN}/result.html?status=success&id=${targetSurveyId}&token=${storedToken}`;
    const { emailHtml, emailText } = createEmailTemplate(recoveryLink, targetSurveyId);
    
    const fromAddress = `SurveyKit <${SENDER_EMAIL}>`;
    console.log(`[INFO] Attempting to send email via Resend from "${fromAddress}" to "${storedUserEmail}"`);
    const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [storedUserEmail],
        subject: `[SurveyKit] 您的问卷结果找回链接`,
        html: emailHtml,
        text: emailText,
    });

    if (error) {
        console.error("[ERROR] Resend SDK email sending failed:", JSON.stringify(error, null, 2));
        return response.status(500).json({ message: "邮件发送失败，可能是服务暂时不可用，请稍后再试。" });
    }

    console.log(`[SUCCESS] Email sent successfully. Resend ID: ${data.id}`);
    return response.status(200).json({ success: true, message: `专属链接已成功发送至您的邮箱 (${storedUserEmail})！请注意查收。` });

  } catch (error) {
    console.error("[FATAL] Unhandled error in recovery handler:", error);
    return response.status(500).json({ message: "服务器发生未知错误，请稍后重试。" });
  } finally {
      console.log(`[${new Date().toISOString()}] --- Request to recover-link finished ---`);
  }
}