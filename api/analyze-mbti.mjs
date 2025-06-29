import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod"; // 引入 Zod 用于请求体校验
import { randomUUID } from "crypto"; // 引入 randomUUID 用于生成 Token

const ARK_API_KEY = process.env.ARK_API_KEY;
const MODEL_ID = "doubao-seed-1-6-flash-250615";
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:mbti_analysis",
});

// 定义请求体 Schema
const AnalyzeSchema = z.object({
    surveyId: z.string().optional(),
    answersText: z.string().optional(),
    // 允许传入 token 用于管理员访问
    token: z.string().optional(), 
}).refine(data => data.surveyId || data.answersText, {
    message: "请求体中必须包含 'surveyId' 或 'answersText'。",
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }
  if (!ARK_API_KEY) {
    return response.status(500).json({ message: "服务器端API密钥未配置。" });
  }

  try {
    const ip = request.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return response.status(429).json({ message: "请求过于频繁，请稍后再试。" });
    }
  } catch (error) {
    console.error("速率限制器出错:", error);
  }

  try {
    const validationResult = AnalyzeSchema.safeParse(request.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
    }

    const { surveyId, answersText, token: userToken } = validationResult.data;
    const adminToken = process.env.ADMIN_TOKEN;
    let finalAnswersText = "";

    // 管理员权限检查
    if (adminToken && userToken === adminToken && surveyId) {
        const storedData = await kv.hgetall(`survey:${surveyId}`);
        if (!storedData || !storedData.data) {
            return response.status(404).json({ message: `(Admin) 问卷 ${surveyId} 不存在或无数据。` });
        }
        finalAnswersText = Object.entries(JSON.parse(storedData.data))
                               .map(([key, value]) => `- ${key}: ${value}`)
                               .join("\n");
    } else if (surveyId) {
        // 对于普通用户，analyze-mbti 不应该直接根据 surveyId 获取答案
        // 因为这会绕过 get-survey.mjs 的授权逻辑
        // 如果这里需要直接从 surveyId 获取数据，那么需要传入普通用户 token
        // 但更好的做法是，前端在调用 analyze-mbti 之前，
        // 应该先通过 get-survey.mjs 获取到答案，再将答案作为 answersText 传递。
        // 为了避免复杂性并符合原逻辑，我暂时假设这里的 surveyId 已经是公开的，或者前端已经获取了答案并传入。
        // 如果 surveyId 对应的问卷数据需要授权才能访问，那这里的逻辑就是漏洞。
        // *** 重要的安全提示：除非 analyze-mbti 是公开的，否则不应直接根据 surveyId 拉取数据而无授权。 ***
        // 为了保持功能和当前逻辑，我将延续其获取数据的行为，但请注意这个潜在问题。
        const storedData = await kv.hgetall(`survey:${surveyId}`);
        if (!storedData || !storedData.data) {
            return response.status(404).json({ message: `未找到ID为 ${surveyId} 的问卷。` });
        }
        // 如果这里需要验证普通用户的token，你需要从请求中获取它，并与 `storedData.token` 比较。
        // 但通常，MBTI分析是一个可选功能，可能允许匿名或未授权的分析（例如，用户复制自己的答案文本来分析）。
        // 如果 MBTI 分析必须与特定问卷及其授权令牌绑定，这个API的设计需要更改。
        // 当前修改仅针对管理员后门。
        finalAnswersText = Object.entries(JSON.parse(storedData.data))
                               .map(([key, value]) => `- ${key}: ${value}`)
                               .join("\n");
    } else if (answersText) {
      finalAnswersText = answersText;
    } else {
      return response.status(400).json({ message: "请求体中必须包含 'surveyId' 或 'answersText'。" });
    }

    const prompt = `你是一位专业的MBTI人格分析师。这里有一份深度问卷的答案，请你根据这些答案，分析出答题者的MBTI人格类型。你的回答必须且只能是一个格式正确的 **JSON** 对象，不包含任何Markdown标记（如 \`\`\`json）或其他解释性文本。这个 **JSON** 对象的结构必须如下：{"mbti_type": "（例如：INFJ）","type_name": "（例如：提倡者）","tagline": "（用一句简短、诗意的话总结这个人格。）","analysis_report": ["（第一段分析：结合具体答案作为论据。）","（第二段分析：描述这种人格类型的主要特点、优点和潜在挑战。）","（第三段分析：提供一条真诚、个性化的发展建议。）"]}以下是用户的问卷答案：---${finalAnswersText}---`;

    const payload = {
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0.5,
    };

    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ARK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error("火山方舟API返回错误:", errorBody);
      const errorMessage = errorBody.error?.message || "AI服务返回未知错误";
      return response.status(apiResponse.status).json({ message: errorMessage });
    }

    const data = await apiResponse.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI未能生成任何内容。");
    }

    const analysisResult = JSON.parse(content);
    return response.status(200).json(analysisResult);
  } catch (error) {
    console.error("MBTI分析时发生内部错误:", error);
    let message = "服务内部错误";
    if (error instanceof SyntaxError) {
      message = "AI返回的格式不正确，无法解析。";
    } else if (error.message) {
      message = error.message;
    }
    return response.status(500).json({ message });
  }
}