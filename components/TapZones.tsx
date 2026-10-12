"use client";

import { useSwipe } from "@/lib/useSwipe";

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

/**
 * 桌面点击热区：左右各 30% 透明层，点击/横向滑动翻页。
 * 中间 40% 留给内容区（点击切换 chrome、滑动翻页、纵向滚动都在内容区处理）。
 */
export function TapZones({ onPrev, onNext }: Props) {
  // 滑动方向与语义绑定：向左滑 = 下一页，向右滑 = 上一页
  const swipe = useSwipe(onNext, onPrev);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none" aria-hidden="true">
      <div
        data-tap-zone
        onClick={() => swipe.consumeClick(onPrev)}
        {...swipe.handlers}
        className="absolute left-0 top-0 bottom-0 w-[30%] pointer-events-auto touch-none"
      />
      <div
        data-tap-zone
        onClick={() => swipe.consumeClick(onNext)}
        {...swipe.handlers}
        className="absolute right-0 top-0 bottom-0 w-[30%] pointer-events-auto touch-none"
      />
    </div>
  );
}
