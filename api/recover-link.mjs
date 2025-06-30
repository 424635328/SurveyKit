import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const YOUR_APP_DOMAIN = "https://survey-kit.vercel.app";

const resend = new Resend(RESEND_API_KEY);

const emailRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ratelimit:email_recovery",
});

const RequestSchema = z.object({
  email: z.string().email({ message: "无效的邮箱格式" }).optional(),
  surveyId: z.string().min(1, { message: "问卷ID不能为空" }).optional(),
}).refine(data => data.email || data.surveyId, {
    message: "必须提供邮箱或问卷ID"
});

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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  if (!RESEND_API_KEY || !SENDER_EMAIL) {
    console.error("关键环境变量 RESEND_API_KEY 或 SENDER_EMAIL 未配置。");
    return response.status(500).json({ message: "邮件服务未正确配置。" });
  }

  try {
    const validationResult = RequestSchema.safeParse(request.body);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }
    
    const { email: userEmailInput, surveyId: userSurveyIdInput } = validationResult.data;
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress || '127.0.0.1';
    const identifier = userEmailInput?.toLowerCase() || userSurveyIdInput || ip;

    const { success, limit, reset } = await emailRatelimit.limit(identifier);
    if (!success) {
      const secondsToWait = Math.ceil((reset - Date.now()) / 1000);
      return response.status(429).json({ 
          message: `请求过于频繁，请在 ${secondsToWait} 秒后重试。`,
          retryAfter: secondsToWait
      });
    }
    
    let targetSurveyId = null;
    let storedToken = null;
    let storedUserEmail = null;
    let isMatch = false;

    if (userSurveyIdInput) {
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
        const emailKey = `email_to_survey_ids:${userEmailInput.toLowerCase()}`;
        const surveyIds = await kv.lrange(emailKey, 0, 0);
        if (surveyIds && surveyIds.length > 0) {
            const latestSurveyId = surveyIds[0];
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
        return response.status(404).json({ message: "无法找到匹配的记录。请仔细检查您输入的问卷ID或邮箱地址。" });
    }

    const recoveryLink = `${YOUR_APP_DOMAIN}/result.html?status=success&id=${targetSurveyId}&token=${storedToken}`;
    const { emailHtml, emailText } = createEmailTemplate(recoveryLink, targetSurveyId);
    
    const fromAddress = `SurveyKit <${SENDER_EMAIL}>`;
    const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [storedUserEmail],
        subject: `[SurveyKit]`,
        html: emailHtml,
        text: emailText,
    });

    if (error) {
        console.error("Resend SDK email sending failed:", error);
        return response.status(500).json({ message: "邮件发送失败，可能是服务暂时不可用，请稍后再试。" });
    }

    return response.status(200).json({ success: true, message: `专属链接已成功发送至您的邮箱 (${storedUserEmail})！请注意查收。` });

  } catch (error) {
    console.error("处理找回链接请求时发生未预期错误:", error);
    return response.status(500).json({ message: "服务器发生未知错误，请稍后重试。" });
  }
}