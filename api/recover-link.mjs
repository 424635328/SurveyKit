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
 * 创建用于找回链接的邮件模板 (HTML 和纯文本) - SurveyKit 品牌化版本
 * @param {string} recoveryLink - 生成的专属找回链接
 * @param {string} surveyId - 对应的问卷ID
 * @returns {{emailHtml: string, emailText: string}}
 */
function createEmailTemplate(recoveryLink, surveyId) {
    const preheaderText = "您的 SurveyKit 问卷结果已准备就绪。";
    const projectUrl = "https://survey-kit.vercel.app"; // 项目主页URL
    const logoUrl = "https://survey-kit.vercel.app/favicon.ico"; // 项目Logo URL
    const currentYear = new Date().getFullYear();

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>您的 SurveyKit 问卷结果</title>
        <style>
            /* --- 全局样式 --- */
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", 'Microsoft Yahei';
                margin: 0; 
                padding: 0; 
                width: 100% !important;
                background-color: #111827; /* 深色背景，匹配项目风格 */
                color: #374151;
            }
            .container { 
                max-width: 520px; 
                margin: 40px auto; 
                background-color: #ffffff; 
                border-radius: 12px; 
                overflow: hidden;
            }
            p {
                line-height: 1.7;
                font-size: 16px;
                margin: 0 0 18px;
                color: #374151;
            }
            a {
                color: #4f46e5;
                text-decoration: none;
                font-weight: 500;
            }
            strong {
                color: #1f2937;
            }

            /* --- 模块样式 --- */
            .header {
                padding: 32px 0;
                text-align: center;
            }
            .header img {
                width: 72px;
                height: 72px;
            }
            .content {
                padding: 10px 40px 30px;
            }
            .content .greeting {
                font-size: 22px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 24px;
            }
            .button-wrapper {
                text-align: center;
                margin: 32px 0;
            }
            .button {
                display: inline-block;
                background-color: #4f46e5;
                color: #ffffff !important; /* 强制覆盖 a 标签颜色 */
                text-decoration: none;
                padding: 16px 38px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                transition: background-color 0.3s ease;
                /* 柔和的阴影，类似 Tailwind */
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            }
            .button:hover {
                background-color: #4338ca;
            }
            .fallback-info {
                background-color: #f9fafb;
                border: 1px solid #f3f4f6;
                border-radius: 8px;
                padding: 16px;
                text-align: left;
                font-size: 13px;
                color: #6b7280;
                margin-top: 24px;
            }
            .fallback-info code {
                display: block;
                background-color: #f3f4f6;
                padding: 10px;
                border-radius: 6px;
                font-family: 'Courier New', Courier, monospace;
                color: #4f46e5;
                word-break: break-all;
                margin-top: 10px;
                font-size: 14px;
            }
            .security-note {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
            }
            .footer {
                padding: 32px 40px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                background-color: #f9fafb;
            }
            .preheader { display: none; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; }
        </style>
    </head>
    <body>
        <span class="preheader">${preheaderText}</span>
        <div class="container">
            <div class="header">
                <a href="${projectUrl}" target="_blank" rel="noopener">
                    <img src="${logoUrl}" alt="SurveyKit Logo">
                </a>
            </div>
            <div class="content">
                <p class="greeting">您的问卷结果已准备就绪</p>
                <p>您好！您请求了访问 SurveyKit 问卷 (ID: <strong>${surveyId}</strong>) 的结果。 </p>
                <p>这是您的专属安全链接，请点击下方按钮访问：</p>
                
                <div class="button-wrapper">
                    <a href="${recoveryLink}" class="button" target="_blank" rel="noopener">查看我的问卷结果</a>
                </div>

                <div class="fallback-info">
                    <p style="margin: 0; font-weight: 500;">如果按钮无法点击：</p>
                    <p style="margin: 10px 0 0;">请手动复制下方的完整链接并在浏览器的新标签页中打开。</p>
                    <code>${recoveryLink}</code>
                </div>

                <div class="security-note">
                    <p style="margin: 0;"><strong>重要提示：</strong>为保护您的隐私，此链接是访问该问卷结果的唯一凭证，请勿与他人分享。如果您并未请求此邮件，请直接忽略，您的账户和数据都是安全的。</p>
                </div>
            </div>
            <div class="footer">
                <p>由 <a href="https://github.com/424635328" target="_blank">424635328</a> 的 <a href="${projectUrl}" target="_blank">SurveyKit</a> 倾心打造</p>
                <p>© ${currentYear} SurveyKit. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const emailText = `
您的 SurveyKit 问卷结果已准备就绪
${preheaderText}

====================================

您好！

您请求了访问 SurveyKit 问卷 (ID: ${surveyId}) 的结果。
请访问下方的专属安全链接，即可查看。

↓↓↓ 访问链接 ↓↓↓
${recoveryLink}

====================================

重要安全提示：
为保护您的隐私，请不要将此链接分享给他人。它是访问您问卷结果的唯一凭证。

如果您没有进行此操作，请放心，您的数据是安全的，直接忽略此邮件即可。

---
此邮件由 SurveyKit 自动发送。
由 424635328 倾心打造。
© ${currentYear} SurveyKit. All Rights Reserved.
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