// api/analyze-mbti.mjs - 最终修复版 (使用原生 fetch，并修正 Prompt)

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";

// =======================================================
// 模块 1: 配置与初始化
// =======================================================
const ARK_API_KEY = process.env.ARK_API_KEY;
const MODEL_ID = "doubao-seed-1-6-flash-250615";
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

// =======================================================
// 模块 2: 速率限制器 
// =======================================================
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:mbti_analysis",
});

// =======================================================
// 模块 3: API 主处理函数 
// =======================================================
export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }
  if (!ARK_API_KEY) {
    console.error("CRITICAL: ARK_API_KEY environment variable is not set!");
    return response.status(500).json({ message: "服务器端API密钥未配置。" });
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
    const { surveyId, answersText } = request.body;
    let finalAnswersText = "";

    if (surveyId) {
      const surveyData = await kv.hgetall(surveyId);
      if (!surveyData)
        return response
          .status(404)
          .json({ message: `未找到ID为 ${surveyId} 的问卷。` });
      finalAnswersText = Object.entries(surveyData)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n");
    } else if (answersText) {
      finalAnswersText = answersText;
    } else {
      return response
        .status(400)
        .json({ message: "请求体中必须包含 'surveyId' 或 'answersText'。" });
    }

    const prompt = `
            你是一位专业的MBTI人格分析师。这里有一份深度问卷的答案，请你根据这些答案，分析出答题者的MBTI人格类型。
            你的回答必须且只能是一个格式正确的 **JSON** 对象，不包含任何Markdown标记（如 \`\`\`json）或其他解释性文本。
            这个 **JSON** 对象的结构必须如下：
            {
              "mbti_type": "（例如：INFJ）",
              "type_name": "（例如：提倡者）",
              "tagline": "（用一句简短、诗意的话总结这个人格。）",
              "analysis_report": [
                "（第一段分析：结合具体答案作为论据。）",
                "（第二段分析：描述这种人格类型的主要特点、优点和潜在挑战。）",
                "（第三段分析：提供一条真诚、个性化的发展建议。）"
              ]
            }
            以下是用户的问卷答案：
            ---
            ${finalAnswersText}
            ---
        `;

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
      return response
        .status(apiResponse.status)
        .json({ message: errorMessage });
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
