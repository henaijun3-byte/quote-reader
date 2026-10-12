"use client";

/** 顶部 2px 进度条：宽度 = 阅读百分比，amber 色 */
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-800/60">
      <div
        className="h-full bg-amber-400 transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
