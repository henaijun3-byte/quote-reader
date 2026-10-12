"use client";

import Link from "next/link";
import type { FontSize } from "@/lib/types";
import { FONT_SIZES } from "@/lib/settings";

const FONT_LABELS: Record<FontSize, string> = { sm: "小", md: "中", lg: "大" };

type Props = {
  name: string;
  index: number;
  total: number;
  fontSize: FontSize;
  onFontSize: (size: FontSize) => void;
  onPrev: () => void;
  onNext: () => void;
  visible: boolean;
};

/** 阅读页 chrome：header（返回/标题/字号）+ footer（计数/翻页按钮），随 visible 淡入淡出 */
export function ReaderChrome({
  name,
  index,
  total,
  fontSize,
  onFontSize,
  onPrev,
  onNext,
  visible,
}: Props) {
  const chrome = `relative z-40 transition-opacity duration-500 ${
    visible ? "opacity-100" : "opacity-0 pointer-events-none"
  }`;

  return (
    <>
      <header
        className={`${chrome} flex items-center justify-between gap-3 px-4 sm:px-6 py-3`}
      >
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors shrink-0"
        >
          ← 返回
        </Link>
        <h2 className="text-zinc-400 text-sm tracking-[0.3em] truncate">
          {name}
        </h2>
        <div className="flex gap-1 shrink-0">
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onFontSize(s)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                fontSize === s
                  ? "text-amber-300 bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {FONT_LABELS[s]}
            </button>
          ))}
        </div>
      </header>

      <footer
        className={`${chrome} flex items-center justify-between px-4 sm:px-6 pb-5`}
      >
        <button
          onClick={onPrev}
          aria-label="上一则"
          disabled={index === 0}
          className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-30"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-zinc-500 text-xs tabular-nums tracking-[0.25em]">
          第 {index + 1} / {total} 则
        </span>
        <button
          onClick={onNext}
          aria-label="下一则"
          disabled={index === total - 1}
          className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-30"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </footer>
    </>
  );
}
