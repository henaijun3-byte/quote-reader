import type { FontSize } from "@/lib/types";

// 阅读偏好（仅客户端调用）：目前只有字号三档
const SETTINGS_KEY = "quote-reader:settings:v1";

export const FONT_SIZES: FontSize[] = ["sm", "md", "lg"];

/** 读字号；非法值回落默认 'md' */
export function loadFontSize(): FontSize {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "md";
    const parsed = JSON.parse(raw) as { fontSize?: string };
    return FONT_SIZES.includes(parsed?.fontSize as FontSize)
      ? (parsed.fontSize as FontSize)
      : "md";
  } catch {
    return "md";
  }
}

export function saveFontSize(size: FontSize): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize: size }));
  } catch {
    // 无痕模式静默降级
  }
}
