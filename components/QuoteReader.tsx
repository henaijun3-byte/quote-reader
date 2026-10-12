// components/QuoteReader.tsx
// 极简垂直沉浸式语录阅读器 —— 完整版
// UI + 按钮/键盘/触屏滑动翻页 + localStorage 进度记忆 + 设置弹窗（字号/主题）
// + 语录收藏（单页切换收藏列表）+ 关键词搜索（结果列表点击跳转）
// 数据来源：data/quotes.json（结构 [{id:number, content:string}]）

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import quotesData from "@/data/quotes.json";

type Quote = { id: number; content: string };
// 翻页状态机：idle 静止 / dragging 跟手拖动 / exiting 旧页滑出 / enteringStart 新页瞬移到另一侧 / entering 新页滑入
type Phase = "idle" | "dragging" | "exiting" | "enteringStart" | "entering";
type Theme = "dark" | "light";
type Settings = { fontSize: number; theme: Theme };
type View = "reader" | "favorites"; // 页面切换：阅读页 / 收藏列表页（单页 state 切换，无路由）

const STORAGE_KEY = "quote-reader:current-index:v1"; // 阅读序号 key
const SETTINGS_KEY = "quote-reader:settings:v1"; // 设置 key（字号 + 主题）
const FAVORITES_KEY = "quote-reader:favorites:v1"; // 收藏列表 key（语录 id 数组）
const SWIPE_THRESHOLD_PX = 50; // 滑动阈值：超过 50px 才翻页，避免点击误触发
const TURN_MS = 260; // 页面平移过渡时长（ms）
const FONT_MIN = 16; // 字号下限
const FONT_MAX = 32; // 字号上限
const FONT_DEFAULT = 24; // 默认字号
const DEFAULT_SETTINGS: Settings = { fontSize: FONT_DEFAULT, theme: "dark" };

/* 读取设置：非法值回落默认（try/catch 兼容无痕模式） */
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const fontSize =
      typeof parsed.fontSize === "number" &&
      parsed.fontSize >= FONT_MIN &&
      parsed.fontSize <= FONT_MAX
        ? Math.round(parsed.fontSize)
        : FONT_DEFAULT;
    const theme: Theme = parsed.theme === "light" ? "light" : "dark";
    return { fontSize, theme };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* ---- 小组件图标（stroke 线性风格，与整体 UI 一致） ---- */
function HeartIcon({ size = 18, filled }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function GearIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function QuoteReader() {
  const quotes = quotesData as Quote[];
  const total = quotes.length;

  const [index, setIndex] = useState(0); // 当前阅读序号（0-based，显示时 +1）
  const [dragX, setDragX] = useState(0); // 页面当前平移量（px）
  const [phase, setPhaseState] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle"); // 镜像，供回调读最新 phase
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const [fontSize, setFontSize] = useState(FONT_DEFAULT); // 正文字号（px）
  const [theme, setTheme] = useState<Theme>("dark"); // 深色 / 浅色
  const [settingsOpen, setSettingsOpen] = useState(false); // 设置弹窗开关
  const dark = theme === "dark";

  const [view, setView] = useState<View>("reader"); // 阅读页 / 收藏列表页
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // 已收藏语录 id 列表
  const [searchText, setSearchText] = useState(""); // 搜索关键词（非空即进入搜索态）

  const startXRef = useRef(0); // 触摸起点 X
  const pendingDirRef = useRef<1 | -1 | 0>(0); // 已提交但未换页的翻页方向
  const quoteWrapRef = useRef<HTMLDivElement | null>(null); // 强制 reflow 用
  const exitTimerRef = useRef<number | null>(null); // 滑出看门狗：transitionend 未触发时的兜底
  const settleTimerRef = useRef<number | null>(null); // 滑入看门狗
  const readyRef = useRef(false); // 恢复完成前不写 localStorage（防覆盖存档）

  /* ---- 挂载后恢复：阅读位置 + 设置 + 收藏（setTimeout 保证 hydration 后读，无 mismatch） ---- */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "", 10);
      if (Number.isFinite(saved) && saved >= 0 && saved < total) {
        setIndex((prev) => (prev === 0 ? saved : prev)); // 用户已手动翻页则不覆盖
      }
      const s = loadSettings();
      setFontSize(s.fontSize);
      setTheme(s.theme);
      // 恢复收藏列表：过滤掉数据中已不存在的 id
      try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
        if (Array.isArray(parsed)) {
          const valid = new Set(quotes.map((q) => q.id));
          setFavoriteIds(
            parsed.filter(
              (x): x is number => typeof x === "number" && valid.has(x),
            ),
          );
        }
      } catch {
        // 收藏数据损坏则从空列表开始
      }
      readyRef.current = true;
    }, 0);
    return () => window.clearTimeout(t);
  }, [total, quotes]);

  /* ---- 翻页即自动保存序号 ---- */
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(index));
    } catch {
      // 无痕模式 setItem 会抛异常：静默降级，不影响阅读
    }
  }, [index]);

  /* ---- 设置变更即自动保存（字号 / 主题） ---- */
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize, theme }));
    } catch {
      // 无痕模式静默降级
    }
  }, [fontSize, theme]);

  /* ---- 收藏列表变更即自动保存（刷新不丢失） ---- */
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch {
      // 无痕模式静默降级
    }
  }, [favoriteIds]);

  /* ---- 卸载时清理看门狗定时器 ---- */
  useEffect(
    () => () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    },
    [],
  );

  /* ---- 派生数据 ---- */
  const keyword = searchText.trim();
  const searching = keyword !== ""; // 搜索态：非空关键词
  const results = searching
    ? quotes.filter((q) => q.content.includes(keyword))
    : [];
  const favQuotes = quotes.filter((q) => favoriteIds.includes(q.id)); // 收藏列表（按数据顺序）

  /* ---- 收藏 / 取消收藏当前语录 ---- */
  const toggleFavorite = useCallback((quoteId: number) => {
    setFavoriteIds((ids) =>
      ids.includes(quoteId)
        ? ids.filter((x) => x !== quoteId)
        : [...ids, quoteId],
    );
  }, []);

  /* ---- 从收藏/搜索结果跳转到对应语录：重置动画状态，切回阅读页 ---- */
  const jumpToQuote = useCallback(
    (quoteId: number) => {
      const i = quotes.findIndex((q) => q.id === quoteId);
      if (i < 0) return;
      pendingDirRef.current = 0;
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      setPhase("idle");
      setDragX(0);
      setIndex(i);
      setSearchText(""); // 清空搜索，回到正常阅读界面
      setView("reader");
    },
    [quotes, setPhase],
  );

  /* ---- 按钮/键盘翻页：到首条/末条不触发；动画中忽略；搜索/收藏态不翻页 ---- */
  const goPrev = useCallback(() => {
    if (view !== "reader" || searching || phaseRef.current !== "idle") return;
    setIndex((i) => (i <= 0 ? i : i - 1));
  }, [view, searching]);

  const goNext = useCallback(() => {
    if (view !== "reader" || searching || phaseRef.current !== "idle") return;
    setIndex((i) => (i >= total - 1 ? i : i + 1));
  }, [view, searching, total]);

  /* ---- 键盘：← 上一条，→ 下一条，Esc 关闭弹窗/退出搜索 ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // 输入控件内按键不参与翻页
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        setSettingsOpen(false);
        setSearchText(""); // 清空搜索，回到正常阅读界面
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  /* ---- 触屏滑动翻页 ----
   * 只监听 touch 事件：电脑端鼠标拖拽天然不触发，键盘/按钮翻页不受影响 */
  const snapBack = useCallback(() => {
    setPhase("idle");
    setDragX(0); // idle 带过渡，页面自动弹回中心
  }, [setPhase]);

  /* 旧页滑出后：换页 + 新页从另一侧滑入（transitionend 驱动，看门狗兜底） */
  const swapAfterExit = useCallback(
    (dir: 1 | -1) => {
      if (pendingDirRef.current !== dir) return; // 已被处理过（transitionend 先到）
      pendingDirRef.current = 0;
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      const w = window.innerWidth;
      setIndex((i) => (dir === 1 ? i + 1 : i - 1));
      setPhase("enteringStart"); // 无过渡：新页预置到另一侧屏幕外
      setDragX(dir * w);
      requestAnimationFrame(() => {
        void quoteWrapRef.current?.offsetWidth; // 强制布局应用起始位置
        setPhase("entering");
        setDragX(0); // 开启过渡，滑回中心
      });
      settleTimerRef.current = window.setTimeout(() => {
        if (phaseRef.current !== "idle") snapBack(); // 滑入过渡异常时的兜底
      }, TURN_MS + 150);
    },
    [setPhase, snapBack],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    if (phaseRef.current !== "idle" || e.touches.length !== 1) return;
    startXRef.current = e.touches[0].clientX;
    setPhase("dragging");
    setDragX(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (phaseRef.current !== "dragging" || e.touches.length !== 1) return;
    setDragX(e.touches[0].clientX - startXRef.current); // 页面跟手平移
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (phaseRef.current !== "dragging") return;
    const dx =
      (e.changedTouches[0]?.clientX ?? startXRef.current) - startXRef.current;
    // 未超过阈值 → 弹回，不翻页
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) {
      snapBack();
      return;
    }
    const dir: 1 | -1 = dx < 0 ? 1 : -1; // 左滑 = 下一条，右滑 = 上一条
    // 首条/末条 → 弹回，不翻页
    if ((dir === 1 && index >= total - 1) || (dir === -1 && index <= 0)) {
      snapBack();
      return;
    }
    // 提交翻页：旧页带着过渡滑出屏幕
    const w = window.innerWidth;
    pendingDirRef.current = dir;
    setPhase("exiting");
    setDragX(-dir * w);
    exitTimerRef.current = window.setTimeout(
      () => swapAfterExit(dir),
      TURN_MS + 100,
    );
  };

  const onTouchCancel = () => {
    // 浏览器接管手势（如纵向滚动）时复位
    if (phaseRef.current === "dragging") snapBack();
  };

  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== "transform") return;
    if (phaseRef.current === "exiting") {
      const dir = pendingDirRef.current;
      if (dir !== 0) swapAfterExit(dir);
    } else if (phaseRef.current === "entering") {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      setPhase("idle");
      setDragX(0);
    }
  };

  /* 状态机 → 过渡样式：dragging/enteringStart 无过渡（跟手/瞬移），其余带过渡 */
  const turnTransition =
    phase === "dragging" || phase === "enteringStart"
      ? "none"
      : `transform ${TURN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  const quote = quotes[index];

  // 语录数据为空时渲染空页面（index 越界防护）
  if (!quote)
    return (
      <main className={`fixed inset-0 ${dark ? "bg-zinc-950" : "bg-zinc-50"}`} />
    );

  const favorited = favoriteIds.includes(quote.id); // 当前语录是否已收藏

  /* 顶部进度文字：阅读态显示序号；搜索态显示结果数；收藏态显示收藏数 */
  const headerText = searching
    ? `找到 ${results.length} 条`
    : view === "favorites"
      ? `我的收藏 · ${favQuotes.length} 条`
      : `第 ${index + 1} / ${total} 则`;

  return (
    <main
      className={`fixed inset-0 flex flex-col overflow-hidden select-none ${
        dark ? "bg-zinc-950 text-zinc-200" : "bg-zinc-50 text-zinc-800"
      }`}
    >
      {/* 顶部：左收藏入口 / 中进度提示 / 右设置，阅读态下方为搜索框 */}
      <header className="relative px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="flex justify-center">
          <span
            className={`text-xs tracking-[0.35em] ${
              dark ? "text-zinc-500/60" : "text-zinc-500/80"
            }`}
          >
            {headerText}
          </span>
        </div>

        {/* 左：收藏入口（收藏态变为返回） */}
        <button
          onClick={() => setView(view === "reader" ? "favorites" : "reader")}
          aria-label={view === "reader" ? "收藏列表" : "返回阅读"}
          className={`absolute left-3 sm:left-5 top-5 sm:top-7 rounded-full p-1.5 transition-colors ${
            dark
              ? "text-zinc-500/70 hover:text-zinc-300"
              : "text-zinc-500/70 hover:text-zinc-600"
          }`}
        >
          {view === "reader" ? (
            <span className="relative inline-flex">
              <HeartIcon />
              {favoriteIds.length > 0 && (
                <span className="absolute -right-1.5 -top-1 rounded-full bg-rose-500 px-1 text-[9px] leading-3 text-white">
                  {favoriteIds.length}
                </span>
              )}
            </span>
          ) : (
            <ArrowLeftIcon />
          )}
        </button>

        {/* 右：设置 */}
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="设置"
          className={`absolute right-3 sm:right-5 top-5 sm:top-7 rounded-full p-1.5 transition-colors ${
            dark
              ? "text-zinc-500/70 hover:text-zinc-300"
              : "text-zinc-500/70 hover:text-zinc-600"
          }`}
        >
          <GearIcon />
        </button>

        {/* 搜索框：仅阅读态显示；非空即进入搜索列表，清空回到正常阅读 */}
        {view === "reader" && (
          <div className="relative mx-auto mt-4 w-full max-w-xs">
            <span
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
                dark ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索语录…"
              aria-label="搜索语录"
              className={`h-9 w-full rounded-full border pl-9 pr-8 text-xs outline-none transition-colors ${
                dark
                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600"
                  : "border-zinc-200 bg-white/70 text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400"
              }`}
            />
            {searchText !== "" && (
              <button
                onClick={() => setSearchText("")}
                aria-label="清空搜索"
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${
                  dark
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}
      </header>

      {/* 中部：三态 —— 搜索结果列表 / 收藏列表 / 沉浸阅读 */}
      {searching ? (
        /* 搜索结果：点击条目直接跳转对应语录 */
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {results.length === 0 ? (
            <p className="pt-16 text-center text-xs text-zinc-500">
              没有找到相关语录
            </p>
          ) : (
            <ul className="mx-auto max-w-xl space-y-2 pb-4">
              {results.map((q) => (
                <li key={q.id}>
                  <button
                    onClick={() => jumpToQuote(q.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      dark
                        ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                        : "border-zinc-200 bg-white/60 hover:border-zinc-400"
                    }`}
                  >
                    <p
                      className={`line-clamp-2 text-sm leading-relaxed ${
                        dark ? "text-zinc-300" : "text-zinc-700"
                      }`}
                    >
                      {q.content}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : view === "favorites" ? (
        /* 收藏列表：点击条目跳转阅读，点右侧红心取消收藏 */
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {favQuotes.length === 0 ? (
            <p className="pt-16 text-center text-xs text-zinc-500">
              还没有收藏语录，阅读时点红心即可收藏
            </p>
          ) : (
            <ul className="mx-auto max-w-xl space-y-2 pb-4">
              {favQuotes.map((q) => (
                <li
                  key={q.id}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
                    dark
                      ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                      : "border-zinc-200 bg-white/60 hover:border-zinc-400"
                  }`}
                >
                  <button
                    onClick={() => jumpToQuote(q.id)}
                    className="flex-1 text-left"
                  >
                    <p
                      className={`line-clamp-2 text-sm leading-relaxed ${
                        dark ? "text-zinc-300" : "text-zinc-700"
                      }`}
                    >
                      {q.content}
                    </p>
                  </button>
                  <button
                    onClick={() => toggleFavorite(q.id)}
                    aria-label="取消收藏"
                    className={`shrink-0 rounded-full p-1.5 transition-colors ${
                      dark
                        ? "text-rose-400/90 hover:text-rose-300"
                        : "text-rose-500 hover:text-rose-600"
                    }`}
                  >
                    <HeartIcon filled />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* 沉浸阅读主体（触屏滑动在这里生效；touch-pan-y 保留纵向滚动） */
        <div
          className="flex flex-1 items-center justify-center px-8 sm:px-16 touch-pan-y overscroll-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
        >
          {/* 页面容器：translateX 实现跟手平移与滑出/滑入过渡 */}
          <div
            ref={quoteWrapRef}
            onTransitionEnd={onTransitionEnd}
            style={{
              transform: `translateX(${dragX}px)`,
              transition: turnTransition,
            }}
          >
            <blockquote className="max-w-2xl text-center">
              {/* 正文字号由设置滑块控制（16~32px，默认 24px），行距保持宽松 */}
              <p
                className={`font-quote leading-[1.9] ${
                  dark ? "text-zinc-100" : "text-zinc-900"
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {quote.content}
              </p>
            </blockquote>

            {/* 收藏当前语录：小巧红心，点击收藏/取消收藏（随页面一起平移） */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => toggleFavorite(quote.id)}
                aria-label={favorited ? "取消收藏" : "收藏"}
                className={`rounded-full p-2 transition-colors ${
                  favorited
                    ? dark
                      ? "text-rose-400 hover:text-rose-300"
                      : "text-rose-500 hover:text-rose-600"
                    : dark
                      ? "text-zinc-600 hover:text-zinc-400"
                      : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <HeartIcon filled={favorited} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部：上一条 / 下一条（仅沉浸阅读态显示） */}
      {view === "reader" && !searching && (
        <footer className="flex gap-4 px-6 pb-8 sm:px-10">
          <button
            onClick={goPrev}
            className={`flex-1 rounded-full border py-3.5 text-sm transition-colors ${
              dark
                ? "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 active:border-zinc-500"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 active:border-zinc-500"
            }`}
          >
            上一条
          </button>
          <button
            onClick={goNext}
            className={`flex-1 rounded-full border py-3.5 text-sm transition-colors ${
              dark
                ? "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 active:border-zinc-500"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 active:border-zinc-500"
            }`}
          >
            下一条
          </button>
        </footer>
      )}

      {/* 设置弹窗：点击空白区域关闭，面板内点击不关闭 */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xs rounded-2xl border p-6 ${
              dark
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-200 bg-white shadow-xl"
            }`}
          >
            <h3
              className={`mb-5 text-sm tracking-[0.3em] ${
                dark ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              设置
            </h3>

            {/* 字体大小滑块 16~32px，修改即自动保存 */}
            <div className="mb-5">
              <div
                className={`mb-2 flex items-center justify-between text-xs ${
                  dark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                <span>字体大小</span>
                <span className="tabular-nums">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={FONT_MIN}
                max={FONT_MAX}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                aria-label="字体大小"
                className="w-full accent-zinc-500"
              />
            </div>

            {/* 主题切换：深色 / 浅色，选择即自动保存，下次打开自动记住 */}
            <div>
              <div
                className={`mb-2 text-xs ${
                  dark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                主题
              </div>
              <div
                className={`flex rounded-full p-1 ${
                  dark ? "bg-zinc-800" : "bg-zinc-100"
                }`}
              >
                {(["dark", "light"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className={`flex-1 rounded-full py-1.5 text-xs transition-colors ${
                      theme === t
                        ? dark
                          ? "bg-zinc-950 text-zinc-200"
                          : "bg-white text-zinc-900 shadow-sm"
                        : dark
                          ? "text-zinc-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {t === "dark" ? "深色" : "浅色"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
