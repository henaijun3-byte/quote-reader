import type { ProgressEntry, ProgressMap } from "@/lib/types";

// localStorage 进度记忆（仅客户端调用）
// key 带 v1 版本号：未来结构变更可平滑迁移
const PROGRESS_KEY = "quote-reader:progress:v1";

// 模块级缓存：useSyncExternalStore 的 getSnapshot 必须返回稳定引用，
// 否则每次渲染快照都变 → 无限重渲染。写入时失效即可。
let cachedMap: ProgressMap | null = null;

/** 钳制到 [0, total-1]；total <= 0 时返回 0 */
export function clamp(i: number, total: number): number {
  if (!Number.isFinite(i) || total <= 0) return 0;
  return Math.min(Math.max(0, Math.round(i)), total - 1);
}

/** 读取进度表；坏数据 / 无痕模式异常一律返回空表，不影响阅读 */
export function loadProgress(): ProgressMap {
  if (cachedMap) return cachedMap;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const out: ProgressMap = {};
    if (typeof parsed === "object" && parsed !== null) {
      for (const [slug, e] of Object.entries(parsed)) {
        const v = e as ProgressEntry;
        if (v && typeof v.i === "number" && typeof v.t === "number") {
          out[slug] = { i: v.i, t: v.t, at: typeof v.at === "number" ? v.at : 0 };
        }
      }
    }
    cachedMap = out;
    return out;
  } catch {
    return {};
  }
}

/** 写入单人物进度（翻页即写，<100B，同步 setItem 无性能顾虑） */
export function saveProgress(
  slug: string,
  entry: ProgressEntry,
): void {
  try {
    const map = loadProgress();
    map[slug] = entry;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
    cachedMap = map;
  } catch {
    // 无痕模式 setItem 会抛异常：静默降级，不能影响阅读
  }
}
