import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { Person, Quote } from "@/lib/types";

// 数据访问层：整个应用的「API 面」。
// 语录是公开只读的小数据（几十 KB），随 RSC payload 一次下发到客户端，
// 翻页零网络请求 —— 这是沉浸阅读体验的底层保障。

export const getPersonBySlug = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  // 数据库故障要抛错（与 getQuotesByPerson 一致），不能误报为「人物不存在/404」
  if (error) throw error;
  return (data as Person | null) ?? null;
});

export const getQuotesByPerson = cache(async (personId: string) => {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, person_id, content, source, note, sort_order")
    .eq("person_id", personId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Quote[];
});
