"use client";

import Link from "next/link";
import { clamp, loadProgress } from "@/lib/progress";
import { useClientSnapshot } from "@/lib/useClientSnapshot";

type Props = {
  slug: string;
  total: number;
};

/**
 * 落地页进度感知按钮组。
 * 进度经 useClientSnapshot 读取：hydration 首帧为 null（渲染「开始阅读」），
 * 挂载后自动切换到真实存档（切换为「继续阅读」），无 hydration mismatch。
 */
export function ProgressCta({ slug, total }: Props) {
  const entry = useClientSnapshot(() => loadProgress()[slug] ?? null, null);
  const savedIndex = entry ? clamp(entry.i, total) : null;

  const hasProgress = savedIndex !== null && savedIndex > 0;
  const q = hasProgress ? savedIndex + 1 : 1; // ?q 为 1-based 索引
  const percent = hasProgress
    ? Math.round(((savedIndex + 1) / total) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href={hasProgress ? `/read/${slug}?q=${q}` : `/read/${slug}`}
        className="px-10 py-3 rounded-full bg-zinc-100 text-zinc-900 font-medium
                   hover:bg-white transition-colors text-sm md:text-base"
      >
        {hasProgress
          ? `继续阅读 · 第 ${q} / ${total} 则 · 已读 ${percent}%`
          : "开始阅读"}
      </Link>
      {hasProgress && (
        <Link
          href={`/read/${slug}?q=1`}
          className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          重新开始
        </Link>
      )}
    </div>
  );
}
