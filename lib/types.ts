// 与 supabase/schema.sql 表结构对应的类型
export type Person = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  birth_year: number | null;
  death_year: number | null;
};

export type Quote = {
  id: string;
  person_id: string;
  content: string;
  source: string | null;
  note: string | null;
  sort_order: number;
};

export type FontSize = "sm" | "md" | "lg";

// localStorage 进度表：key 为人物 slug
export type ProgressEntry = { i: number; t: number; at: number };
export type ProgressMap = Record<string, ProgressEntry>;
