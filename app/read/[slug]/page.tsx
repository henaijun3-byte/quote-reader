import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPersonBySlug, getQuotesByPerson } from "@/lib/quotes";
import { clamp } from "@/lib/progress";
import { Reader } from "./reader";

// ISR：语录只随 seed 更新，1 小时缓存窗口足够；想立即生效可 Redeploy
export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);
  return person ? { title: `${person.name}语录` } : { title: "未找到" };
}

export default async function ReadPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const person = await getPersonBySlug(slug);
  if (!person) notFound();

  const quotes = await getQuotesByPerson(person.id);
  if (quotes.length === 0) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-zinc-300">这位人物还没有收录语录</p>
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← 返回首页
        </Link>
      </main>
    );
  }

  // ?q=N 深链（1-based，供「继续阅读」）；非法值一律回落默认流程
  const q = Number.parseInt(sp?.q ?? "", 10);
  const fromQParam = Number.isFinite(q) && q > 0;
  const initialIndex = fromQParam ? clamp(q - 1, quotes.length) : 0;

  return (
    <Reader
      person={person}
      quotes={quotes}
      initialIndex={initialIndex}
      fromQParam={fromQParam}
    />
  );
}
