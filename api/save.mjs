// api/save.js - 最终安全加固与优化版

import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

// =======================================================
// 模块 1: 速率限制器配置
// =======================================================
// 使用 Vercel KV 作为存储后端，创建一个新的速率限制器。
// 规则：每个IP地址在1分钟内，最多只能提交5次问卷。
// 这能有效防止简单的机器人恶意刷提交。
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true, // 开启分析，方便在Upstash后台查看速率限制情况
  prefix: "ratelimit:survey", // 为速率限制的key添加一个专属前缀
});

// =======================================================
// 模块 2: 数据校验 Schema 定义
// =======================================================
// 使用 Zod 定义我们期望接收到的数据结构和规则。
// 这可以从源头上杜绝格式错误、类型错误和超长输入的脏数据。
const SurveySchema = z
  .object({
    // --- 示例：为几个不同类型的问题定义规则 ---

    // 对于单选题，我们期望它是一个字符串
    q1_drink_choice: z.string().trim().optional(),

    // 对于颜色选择器，我们期望它是一个标准的HEX颜色码
    q3_theme_color: z
      .string()
      .startsWith("#", { message: "颜色值必须以'#'开头" })
      .length(7, { message: "颜色值必须是7位" })
      .optional()
      .or(z.literal("")),

    // 对于范围滑块，我们期望它是一个在0-100之间的数字字符串
    q11_social_battery: z
      .string()
      .refine(
        (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 0 && num <= 100;
        },
        { message: "社交电量必须是0到100之间的数字" }
      )
      .optional(),

    // 对于文本域，我们可以限制其最大长度
    q70_final_words: z
      .string()
      .trim()
      .max(2000, { message: "悄悄话太长啦，请保持在2000字以内" })
      .optional(),

    // ★ 关键：使用 .catchall(z.any()) 来允许所有其他未明确定义的字段通过。
    // 这确保了我们即使只校验部分字段，也不会影响其他未定义规则的字段的提交。
  })
  .catchall(z.any());

// =======================================================
// 模块 3: API 主处理函数 (Handler)
// =======================================================
export default async function handler(request, response) {
  // --- 步骤 A: 校验请求方法 ---
  if (request.method !== "POST") {
    return response.status(405).json({ message: "仅允许 POST 请求" });
  }

  // --- 步骤 B: 应用速率限制 ---
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
    // 如果速率限制器本身出错，我们选择放行，保证服务可用性，但会记录错误。
  }

  try {
    // --- 步骤 C: 获取并校验数据 ---
    const rawData = request.body;

    // 1. 基础非空校验
    if (!rawData || Object.keys(rawData).length === 0) {
      return response.status(400).json({ message: "请求内容不能为空" });
    }

    // 2. 使用 Zod Schema 进行深度校验
    const validationResult = SurveySchema.safeParse(rawData);

    if (!validationResult.success) {
      // 如果校验失败，返回具体的错误信息
      const firstError = validationResult.error.issues[0];
      const errorMessage = `字段 '${firstError.path.join(".")}' 不合法: ${
        firstError.message
      }`;
      console.warn("数据校验失败:", errorMessage, "原始数据:", rawData);
      return response.status(400).json({ message: errorMessage });
    }

    // 使用 Zod 清理过的数据 (例如 trim 后的)
    const data = validationResult.data;

    // --- 步骤 D: 核心业务逻辑 (数据存储) ---
    const uniqueId = `survey_${Date.now()}`;

    await kv.hset(uniqueId, data);
    await kv.lpush("all_surveys", uniqueId);

    // --- 步骤 E: 返回成功响应 ---
    return response.status(200).json({
      success: true,
      message: "数据已保存",
      id: uniqueId,
    });
  } catch (error) {
    // --- 步骤 F: 统一处理未知错误 ---
    console.error("保存问卷时发生未知错误:", error);
    return response
      .status(500)
      .json({ message: "服务器内部错误，请联系管理员" });
  }
}
