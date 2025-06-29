// api/get-survey.js - 安全与性能优化版

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

// =======================================================
// 模块 1: 速率限制器配置
// =======================================================
// 规则：每个IP地址在1分钟内，最多只能请求10次问卷数据。
// 这个限制比写入API宽松，因为读取操作通常更频繁且成本较低。
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:get_survey",
});


// =======================================================
// 模块 2: 输入校验 Schema 定义
// =======================================================
// 定义我们期望的查询参数的结构和规则。
const QuerySchema = z.object({
  id: z.string()
    .startsWith("survey_", { message: "ID必须以 'survey_' 开头" })
    .regex(/^[a-z0-9_]+$/, { message: "ID只能包含小写字母、数字和下划线" })
    .min(10, { message: "ID长度过短" }),
});


// =======================================================
// 模块 3: API 主处理函数 (Handler)
// =======================================================
export default async function handler(request, response) {
  // --- 步骤 A: 校验请求方法 ---
  if (request.method !== "GET") {
    return response.status(405).json({ message: "仅允许 GET 请求" });
  }

  // --- 步骤 B: 应用速率限制 ---
  try {
    const ip = request.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return response.status(429).json({ message: "请求过于频繁，请稍后再试。" });
    }
  } catch (error) {
    console.error("速率限制器出错:", error);
    // 放行，但记录错误
  }
  
  try {
    // --- 步骤 C: 校验URL查询参数 ---
    const validationResult = QuerySchema.safeParse(request.query);

    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const errorMessage = `参数 'id' 不合法: ${firstError.message}`;
        return response.status(400).json({ message: errorMessage });
    }

    const { id } = validationResult.data;

    // --- 步骤 D: 核心业务逻辑 (从数据库获取数据) ---
    const surveyData = await kv.hgetall(id);

    if (!surveyData) {
      return response.status(404).json({ message: "未找到该问卷" });
    }
    
    // --- 步骤 E: ★ 设置HTTP缓存 ★ ---
    // Cache-Control:
    // - public: 允许CDN和浏览器等任何中间方缓存。
    // - s-maxage=3600: 指示CDN缓存1小时 (3600秒)。
    // - stale-while-revalidate=86400: 即使缓存过期，在接下来的1天(86400秒)内，
    //   Vercel仍会先返回旧的缓存数据，同时在后台异步请求新数据，实现极速加载。
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    // --- 步骤 F: 返回成功响应 ---
    return response.status(200).json(surveyData);

  } catch (error) {
    // --- 步骤 G: 统一处理未知错误 ---
    console.error(`获取问卷 ${request.query.id} 时发生未知错误:`, error);
    return response.status(500).json({ message: "服务器内部错误" });
  }
}