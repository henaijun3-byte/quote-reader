import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "缺少 Supabase 环境变量。请复制 .env.example 为 .env.local 并填入 SUPABASE_URL / SUPABASE_ANON_KEY（见 README）。",
  );
}

// 服务端单例；无 auth 场景，禁用会话持久化
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
