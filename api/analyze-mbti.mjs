import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

const ARK_API_KEY = process.env.ARK_API_KEY;
const MODEL_ID = "doubao-seed-1-6-flash-250615";
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:mbti_analysis",
});

const AnalyzeSchema = z.object({
    surveyId: z.string().optional(),
    answersText: z.string().optional(),
    token: z.string().optional(),
}).refine(data => data.surveyId || data.answersText, {
    message: "请求体中必须包含 'surveyId' 或 'answersText'。",
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  if (!ARK_API_KEY) {
    console.error("Server Error: ARK_API_KEY is not configured.");
    return response.status(500).json({ message: "服务器端API密钥未配置。" });
  }

  try {
    const ip = request.ip ?? "127.0.0.1";
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    if (!success) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', reset);
      return response.status(429).json({ message: "请求过于频繁，请稍后再试。" });
    }
     response.setHeader('X-RateLimit-Limit', limit);
     response.setHeader('X-RateLimit-Remaining', remaining);
     response.setHeader('X-RateLimit-Reset', reset);

  } catch (error) {
    console.error("速率限制器出错:", error);
  }

  const validationResult = AnalyzeSchema.safeParse(request.body);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return response.status(400).json({ message: `请求参数不合法: ${firstError.message}` });
  }

  const { surveyId, answersText } = validationResult.data;
  let finalAnswersText = "";

  try {
    // --- 数据获取逻辑 ---
    if (surveyId) {
        const storedData = await kv.hgetall(`survey:${surveyId}`);

        if (!storedData || storedData.data === undefined || storedData.data === null) {
            console.warn(`Survey ID ${surveyId} not found or data field is missing/null in KV.`);
            return response.status(404).json({ message: `未找到ID为 ${surveyId} 的问卷或数据。` });
        }

        let rawData = storedData.data;
        let answersData;

        if (typeof rawData === 'string') {
            console.log(`KV data for survey ID ${surveyId} is a string. Attempting JSON.parse.`);
            let cleanedDataString = rawData.trim();
             try {
                 answersData = JSON.parse(cleanedDataString);
                  if (typeof answersData !== 'object' || answersData === null) {
                     console.error(`KV data for survey ID ${surveyId} parsed from string but is not an object. Type: ${typeof answersData}`, answersData);
                     throw new Error("解析后的数据不是预期的对象格式。");
                  }
             } catch (parseError) {
                 console.error(`KV data parsing (JSON) failed for survey ID ${surveyId}:`, { raw: rawData, cleaned: cleanedDataString, error: parseError });
                 throw new Error(`问卷数据格式错误，无法解析 JSON: ${parseError.message}`);
             }

        } else if (typeof rawData === 'object' && rawData !== null) {
            console.log(`KV data for survey ID ${surveyId} is already an object. Using directly.`);
            answersData = rawData;
             if (typeof answersData !== 'object' || answersData === null) { // Should not happen based on outer check, but defensive
                  console.error(`KV data for survey ID ${surveyId} is an object but is null or invalid object type.`);
                  throw new Error("问卷数据格式错误：存储了无效的对象。");
             }

        } else {
            console.error(`KV data for survey ID ${surveyId} is neither string nor object. Type: ${typeof rawData}`, rawData);
            return response.status(500).json({ message: `问卷数据格式错误：存储的数据类型异常 (${typeof rawData})。` });
        }

        try {
             finalAnswersText = Object.entries(answersData)
                                .map(([key, value]) => `- ${key}: ${value}`)
                                .join("\n");
             console.log(`Successfully formatted data for survey ID: ${surveyId}`);

        } catch (formatError) {
            console.error(`KV data formatting failed for survey ID ${surveyId}:`, { data: answersData, error: formatError });
            throw new Error(`问卷数据格式化失败: ${formatError.message}`);
        }


    } else if (answersText) {
      finalAnswersText = answersText;
      console.log("Using answersText provided directly.");
    } else {
       console.error("Neither surveyId nor answersText was provided.");
       return response.status(400).json({ message: "请求体中必须包含 'surveyId' 或 'answersText'。" });
    }

    if (!finalAnswersText || finalAnswersText.trim().length < 10) {
         console.warn("Final answers text is empty or too short after formatting.");
         // This might indicate the input data was too sparse to begin with
         throw new Error("提取到的问卷答案内容过少，无法进行有效分析。");
    }


    // --- AI 调用逻辑 ---

    const prompt = `你是一位专业的MBTI人格分析师。请严格根据提供的问卷答案，分析出答题者的MBTI人格类型。你的回答必须 **严格地** 是一个格式正确的 **JSON** 对象，**除了 JSON 对象之外，不包含任何其他文本、前缀、后缀或Markdown标记（如 \`\`\`json\`\`\` 或任何解释性文字）**。这个 **JSON** 对象的结构必须如下：{"mbti_type": "（例如：INFJ，仅四个字母）","type_name": "（例如：提倡者）","tagline": "（用一句简短、诗意的话总结这个人格。）","analysis_report": ["（第一段分析：结合具体答案作为论据。）","（第二段分析：描述这种人格类型的主要特点、优点和潜在挑战。）","（第三段分析：提供一条真诚、个性化的发展建议。）"]}请确保 analysis_report 是一个字符串数组，每个元素是一个段落。以下是用户的问卷答案：\n---\n${finalAnswersText}\n---`;

    const payload = {
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      stream: false,
      temperature: 0.5,
    };

    console.log("Sending payload to AI (truncated prompt):", {
        ...payload,
        messages: [
            { role: "user", content: payload.messages[0].content.substring(0, 500) + "..." }
        ]
    });

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
      console.error("火山方舟API返回错误:", apiResponse.status, errorBody);
      const errorMessage = errorBody.error?.message || `AI服务请求失败，状态码: ${apiResponse.status}`;
      const httpError = new Error(`AI服务请求失败 [状态码: ${apiResponse.status}]: ${errorMessage}`);
      httpError.status = apiResponse.status;
      throw httpError;
    }

    const data = await apiResponse.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
        console.error("AI响应中未找到内容:", data);
        throw new Error("AI 未能生成分析内容。");
    }

    console.log("Received raw AI content:", content);

    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    content = content.trim();
    console.log("Cleaned AI content:", content);

    let analysisResult;
    try {
        analysisResult = JSON.parse(content);
         if (typeof analysisResult !== 'object' || analysisResult === null || typeof analysisResult.mbti_type !== 'string' || !Array.isArray(analysisResult.analysis_report) || typeof analysisResult.type_name !== 'string' || typeof analysisResult.tagline !== 'string') {
             console.error("AI返回的JSON结构不符合预期:", analysisResult);
             throw new Error("AI 返回的分析数据结构不完整或不正确。"); // 细化错误消息
         }
         analysisResult.analysis_report = analysisResult.analysis_report.map(p => String(p));

        // !!! --- 处理异常情况: AI 返回空报告 --- !!!
        // 检查关键字段是否都是空的或默认值
        const isReportEmpty = !analysisResult.mbti_type.trim() && // MBTI类型为空
                              !analysisResult.type_name.trim() && // 类型名称为空
                              !analysisResult.tagline.trim() && // 标签为空
                              (!analysisResult.analysis_report || analysisResult.analysis_report.every(p => !String(p).trim())); // 报告数组为空或全是空白字符串

        if (isReportEmpty) {
             console.warn("AI returned a valid JSON structure but the report content is empty.", analysisResult);
             throw new Error("AI 未能根据提供的问卷答案生成有效的分析报告。请检查答案内容是否足够完整详细。"); // 抛出特定错误
        }
        // !!! --- 结束处理异常情况 --- !!!


    } catch (parseError) { // This catch also catches the new "AI 未能根据..." error
        if (parseError.message.includes("AI 未能根据提供的问卷答案生成有效的分析报告")) {
             // If it's our specific error about empty report, re-throw it as is
             throw parseError;
        }
        // Otherwise, it's a JSON parse error
        console.error("解析AI返回的JSON失败:", content, parseError);
        const jsonParseError = new Error(`AI 返回的数据格式错误，无法解析或结构不正确: ${parseError.message}`); // 细化错误消息
        jsonParseError.originalContent = content;
        throw jsonParseError;
    }

    return response.status(200).json(analysisResult);

  } catch (error) {
    console.error("MBTI分析时发生内部错误:", error);
    let message = "服务内部错误";
    let statusCode = 500;

    if (error.message) {
      message = error.message;
    }
    if (error.status) {
        statusCode = error.status;
    } else if (message.includes("无法解析 JSON") || message.includes("结构不正确") || message.includes("问卷数据格式错误") || message.includes("问卷数据格式化失败")) {
         statusCode = 400; // 数据或格式问题，返回 400
    } else if (message.includes("AI 未能根据提供的问卷答案生成有效的分析报告")) {
         statusCode = 400; // 输入不足或AI无法分析，也返回 400
    } else if (message.includes("AI 未能生成分析内容")) {
         statusCode = 500; // AI 服务端问题，返回 500
    } else if (message.includes("AI服务请求失败")) {
         // 上游AI服务返回的错误，保持原状态码或根据需要映射
         // error.status 应该已经捕获了原始状态码
         if (!error.status || error.status >= 500) {
             statusCode = 500; // 上游服务器错误
         } else {
             statusCode = error.status; // 上游客户端错误 (如 429, 400)
         }
         // Remove status code info from message for user
         message = message.replace(/ \[状态码: \d+\]/, '');
    }


    return response.status(statusCode).json({ message });
  }
}