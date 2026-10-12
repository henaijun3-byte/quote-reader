"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FontSize, Person, Quote } from "@/lib/types";
import { clamp, loadProgress, saveProgress } from "@/lib/progress";
import { loadFontSize, saveFontSize } from "@/lib/settings";
import { useSwipe } from "@/lib/useSwipe";
import { ProgressBar } from "@/components/ProgressBar";
import { ReaderChrome } from "@/components/ReaderChrome";
import { TapZones } from "@/components/TapZones";

type ReaderProps = {
  person: Person;
  quotes: Quote[];
  initialIndex: number;
  fromQParam: boolean;
};

const FONT_CLASSES: Record<FontSize, string> = {
  sm: "text-xl md:text-2xl leading-[1.9]",
  md: "text-2xl md:text-3xl leading-[1.9]",
  lg: "text-3xl md:text-4xl leading-[1.8]",
};

const CHROME_IDLE_MS = 2500;

export function Reader({ person, quotes, initialIndex, fromQParam }: ReaderProps) {
  const router = useRouter();
  const total = quotes.length;

  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1 | 0>(0);
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [done, setDone] = useState(false);

  // chrome 可见性：state + ref 镜像（toggle/poke 需要同步读最新值，避免在 updater 里做副作用）
  const [chromeVisible, setChromeVisibleState] = useState(true);
  const chromeRef = useRef(true);
  const setChromeVisible = useCallback((v: boolean) => {
    chromeRef.current = v;
    setChromeVisibleState(v);
  }, []);
  const hideTimer = useRef<number | null>(null);

  const quote = quotes[index];

  /* ---- 挂载恢复：字号 + localStorage 进度（?q= 优先，fromQParam 时跳过恢复） ---- */
  useEffect(() => {
    // setState 放在异步回调中：恢复外部状态的一次性转换，无级联渲染；
    // 也保证 hydration 完成后才读 localStorage（首帧渲染 index 0，无 mismatch）
    const t = window.setTimeout(() => {
      if (!fromQParam) {
        const saved = loadProgress()[person.slug];
        if (saved) setIndex(clamp(saved.i, total));
      }
      setFontSize(loadFontSize());
    }, 0);
    return () => window.clearTimeout(t);
  }, [person.slug, fromQParam, total]);

  /* ---- 翻页即写进度 ----
   * 仅跳过「挂载后第一次」的初始写入（防覆盖存档）；翻回第 0 条属正常操作，照常保存 */
  const saveMountedRef = useRef(false);
  useEffect(() => {
    const isFirst = !saveMountedRef.current;
    saveMountedRef.current = true;
    if (isFirst && index === 0 && !fromQParam) return;
    saveProgress(person.slug, { i: index, t: total, at: Date.now() });
  }, [index, fromQParam, person.slug, total]);

  /* ---- 页面标题同步 ---- */
  useEffect(() => {
    document.title = `${person.name} · ${index + 1}/${total}`;
  }, [person.name, index, total]);

  /* ---- 翻页：唯一的翻页入口，四通道（按钮/键盘/热区/滑动）都走这里 ---- */
  const turn = useCallback(
    (dir: 1 | -1) => {
      if (done) return;
      const next = index + dir;
      if (next < 0) return;
      if (next >= total) {
        setDone(true);
        setChromeVisible(false);
        return;
      }
      setDirection(dir); // 先设方向再换页，动画方向正确
      setIndex(next);
    },
    [done, index, total, setChromeVisible],
  );

  /* ---- chrome 自动隐藏：任意活动唤回并重置 2.5s 计时；翻页本身不唤回 ---- */
  const poke = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setChromeVisible(false),
      CHROME_IDLE_MS,
    );
  }, [setChromeVisible]);

  const toggleChrome = useCallback(() => {
    const next = !chromeRef.current;
    setChromeVisible(next);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = next
      ? window.setTimeout(() => setChromeVisible(false), CHROME_IDLE_MS)
      : null;
  }, [setChromeVisible]);

  useEffect(() => {
    // 初始显示，静置 2.5s 后淡出（直接起计时器，不调 poke —— effect 体内同步 setState 违反 react-hooks 规则）
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setChromeVisible(false),
      CHROME_IDLE_MS,
    );
    const onPointerMove = (e: PointerEvent) => {
      // 仅鼠标移动唤回 chrome（触屏滑动翻页不应唤回）；热区内移动不唤回
      if (e.pointerType !== "mouse") return;
      if ((e.target as HTMLElement | null)?.closest("[data-tap-zone]")) return;
      poke();
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [poke, setChromeVisible]);

  /* ---- 键盘：←→ 翻页（不唤回 chrome），Escape 回首页，其他按键唤回 ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        turn(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        turn(1);
      } else if (e.key === "Escape") {
        router.push("/");
      } else {
        poke();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn, router, poke]);

  /* ---- 内容区手势：滑动翻页 + 点击切换 chrome；纵向滚动交给浏览器（touch-pan-y） ---- */
  const contentSwipe = useSwipe(() => turn(1), () => turn(-1));

  const handleFontSize = useCallback(
    (s: FontSize) => {
      setFontSize(s);
      saveFontSize(s);
    },
    [],
  );

  const restart = useCallback(() => {
    saveProgress(person.slug, { i: 0, t: total, at: Date.now() });
    setDirection(0);
    setIndex(0);
    setDone(false);
    poke();
  }, [person.slug, total, poke]);

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden select-none bg-zinc-950">
      <ProgressBar percent={((index + 1) / total) * 100} />

      <ReaderChrome
        name={person.name}
        index={index}
        total={total}
        fontSize={fontSize}
        onFontSize={handleFontSize}
        onPrev={() => turn(-1)}
        onNext={() => turn(1)}
        visible={chromeVisible}
      />

      {/* 内容区：居中语录；中间 40% 的点击/滑动/滚动都发生在这里 */}
      <div
        {...contentSwipe.handlers}
        onClick={() => contentSwipe.consumeClick(toggleChrome)}
        className="relative flex-1 overflow-y-auto touch-pan-y overscroll-none px-6 sm:px-10"
      >
        <div className="min-h-full flex items-center justify-center py-16">
          <blockquote
            key={`${index}-${direction}`}
            className={`quote-enter ${
              direction === 1
                ? "from-right"
                : direction === -1
                  ? "from-left"
                  : ""
            } max-w-2xl text-center`}
          >
            <p className={`font-quote text-zinc-100 ${FONT_CLASSES[fontSize]}`}>
              {quote.content}
            </p>
            {quote.source && (
              <footer className="mt-8 text-sm md:text-base text-zinc-500 tracking-wider">
                —— {quote.source}
              </footer>
            )}
          </blockquote>
        </div>
      </div>

      <TapZones onPrev={() => turn(-1)} onNext={() => turn(1)} />

      {done && (
        <div className="overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-7 px-6 text-center">
            <p className="text-zinc-300 text-lg">已读完最后一则</p>
            <div className="flex gap-4">
              <button
                onClick={restart}
                className="px-6 py-2.5 rounded-full bg-zinc-100 text-zinc-900 text-sm hover:bg-white transition-colors"
              >
                重新开始
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
