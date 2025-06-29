import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:get_survey",
});

const QuerySchema = z.object({
  id: z.string().min(1, { message: "ID 不能为空" }),
  token: z.string().optional(),
});

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ message: "仅允许 GET 请求" });
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
    const validationResult = QuerySchema.safeParse(request.query);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return response.status(400).json({ message: `参数不合法: ${firstError.message}` });
    }

    const { id, token: userToken } = validationResult.data;
    const adminToken = process.env.ADMIN_TOKEN;

    const storedRecord = await kv.hgetall(`survey:${id}`);

    if (!storedRecord || typeof storedRecord.token !== 'string' || storedRecord.data == null) {
      console.warn(`问卷 ${id} 不存在或数据结构不完整/类型错误 (KV client auto-deserialization). Record:`, storedRecord);
      // 使用 == null 来同时检查 undefined 和 null
      return response.status(404).json({ message: "问卷不存在或数据已损坏。" });
    }

    const isOwner = userToken === storedRecord.token;
    const isAdmin = adminToken && userToken === adminToken;

    if (isOwner || isAdmin) {
      return response.status(200).json(storedRecord.data);
    }

    if (!userToken) {
        return response.status(401).json({ message: "缺少访问令牌" });
    } else {
        return response.status(403).json({ message: "无权访问此问卷" });
    }

  } catch (error) {
    console.error(`获取问卷 ${request.query.id} 时发生未知错误:`, error);
    return response.status(500).json({ message: "服务器内部错误" });
  }
}