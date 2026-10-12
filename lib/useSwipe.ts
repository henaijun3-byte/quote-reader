"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD_PX = 50;

/**
 * 横向滑动手势：|dx| > 50px 且 |dx| > |dy| 才触发（保护长语录的纵向滚动）。
 * 返回的 handlers 绑定在目标元素上；纵向滚动由容器 touch-action: pan-y
 * 交给浏览器原生处理，互不干扰。
 */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const justSwiped = useRef(false); // 滑动后浏览器仍会派发 click：吞掉，避免一次手势既翻页又点击

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    fired.current = false;
    justSwiped.current = false;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current || fired.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        fired.current = true;
        justSwiped.current = true;
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight],
  );

  const onPointerEnd = useCallback(() => {
    start.current = null;
  }, []);

  /** 包装 onClick：若本次点击紧跟一次滑动，吞掉它 */
  const consumeClick = useCallback((fn: () => void) => {
    if (justSwiped.current) {
      justSwiped.current = false;
      return;
    }
    fn();
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
    consumeClick,
  };
}
