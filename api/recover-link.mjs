// api/recover-link.mjs (完整修改版 - 使用 Resend SDK，增强调试输出，优化邮件模板)

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { Resend } from 'resend';

// --- 环境变量 ---
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const YOUR_APP_DOMAIN = "https://survey-kit.vercel.app";

// DEBUG: 启动时打印环境变量状态
console.log('--- recover-link.mjs Loaded ---');
console.log(`RESEND_API_KEY available: ${!!RESEND_API_KEY}`);
console.log(`SENDER_EMAIL: ${SENDER_EMAIL}`);
console.log(`YOUR_APP_DOMAIN: ${YOUR_APP_DOMAIN}`);
console.log('-------------------------------');


// --- 初始化 Resend 客户端 ---
const resend = new Resend(RESEND_API_KEY);

// --- 初始化速率限制器 ---
const emailRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 放宽一点限制，例如10分钟5次
  prefix: "ratelimit:email_recovery",
});

// --- 输入参数校验 Schema ---
const RequestSchema = z.object({
  email: z.string().email({ message: "无效的邮箱格式" }).optional(),
  surveyId: z.string().min(1, { message: "问卷ID不能为空" }).optional(),
}).refine(data => data.email || data.surveyId, {
    message: "必须提供邮箱或问卷ID"
});

// --- 邮件模板生成函数 (新增) ---
function createEmailTemplate(recoveryLink, surveyId) {
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
            .link-wrapper { word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 14px; text-align: center; }
            .link-wrapper a { color: #4f46e5; text-decoration: none; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
            .footer p { margin: 0 0 8px; }
        </style>
    </head>
    <body>
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
                <p>如果按钮无法点击，您也可以复制下方的完整链接并在浏览器中打开：</p>
                <div class="link-wrapper">
                    <a href="${recoveryLink}">${recoveryLink}</a>
                </div>
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


// --- Serverless Function Handler ---
export default async function handler(request, response) {
  // ... (前面的1-4部分，包括请求方法检查、环境配置检查、速率限制检查等，保持不变) ...

  try {
    // 5. 校验请求参数
    // ... (保持不变) ...
    const validationResult = RequestSchema.safeParse(request.body);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }
    const { email: userEmailInput, surveyId: userSurveyIdInput } = validationResult.data;

    
    // --- 6. 查找问卷记录 ---
    // ... (保持不变) ...
    let targetSurveyId = null;
    let storedToken = null;
    let storedUserEmail = null;

    if (userSurveyIdInput) {
        const surveyRecord = await kv.hgetall(`survey:${userSurveyIdInput}`);
        if (surveyRecord && surveyRecord.token && surveyRecord.userEmail) {
            targetSurveyId = userSurveyIdInput;
            storedToken = surveyRecord.token;
            storedUserEmail = surveyRecord.userEmail; 
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
            }
        }
    }

    if (!targetSurveyId || !storedToken || !storedUserEmail) {
        return response.status(404).json({ message: "未找到匹配的问卷，请检查您输入的ID或邮箱是否正确。" });
    }

    if (userEmailInput && storedUserEmail.toLowerCase() !== userEmailInput.toLowerCase()) {
        return response.status(400).json({ message: "输入的邮箱与问卷记录不符。" });
    }


    // --- 7. 生成恢复链接和邮件内容 ---
    const recoveryLink = `${YOUR_APP_DOMAIN}/result.html?id=${targetSurveyId}&token=${storedToken}`;
    const { emailHtml, emailText } = createEmailTemplate(recoveryLink, targetSurveyId); // 调用新函数
    
    // --- 8. 使用 Resend SDK 发送邮件 ---
    try {
        console.log(`DEBUG: Attempting to send email to: ${storedUserEmail} from: ${SENDER_EMAIL}`);
        const { data, error } = await resend.emails.send({
            from: SENDER_EMAIL, // 优化发件人显示名称
            to: [storedUserEmail],
            subject: `[SurveyKit] 您的问卷结果专属链接`, // 优化邮件标题
            html: emailHtml, // 使用美化后的HTML
            text: emailText, // 提供纯文本版本，提高送达率
        });

        if (error) {
            console.error("DEBUG: Resend SDK email sending failed:", error);
            return response.status(500).json({ message: "邮件发送失败，可能是服务暂时不可用，请稍后再试。" });
        }

        console.log(`DEBUG: Email sent successfully to ${storedUserEmail}. Resend ID: ${data.id}`);
        return response.status(200).json({ success: true, message: `专属链接已成功发送至您的邮箱 (${storedUserEmail})！请注意查收。` });

    } catch (emailError) {
        console.error("DEBUG: 邮件发送过程捕获到错误:", emailError);
        return response.status(500).json({ message: "发送邮件时发生内部错误，请稍后再试。" });
    }

  } catch (error) {
    console.error("DEBUG: 处理找回链接请求时发生未预期错误:", error);
    return response.status(500).json({ message: "服务器内部错误，请稍后再试。" });
  } finally {
      console.log('--- Request processing finished ---');
  }
}