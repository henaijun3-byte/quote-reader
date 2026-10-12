"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * 读取只在客户端存在的外部数据（localStorage 等）：
 * 服务端与 hydration 首帧返回 serverSnapshot（避免 mismatch），
 * 挂载后 React 自动切换到真实客户端值。
 * 注意：read 必须返回稳定引用（见 lib/progress.ts 的模块级缓存），
 * 否则 useSyncExternalStore 会因快照每次变化而无限重渲染。
 */
export function useClientSnapshot<T>(read: () => T, serverSnapshot: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverSnapshot);
}
