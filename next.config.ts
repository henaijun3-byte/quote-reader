import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 关闭 cacheComponents：阅读页依赖 initialIndex/fromQParam 等 props 在
  // 每次导航（如「重新开始」?q=1）时重新生效；组件缓存会导致旧状态被复用
  cacheComponents: false,
  experimental: {
    // 由 Next.js 安全升级流程设置（next upgrade --agent=security）
    agentUpgrade: "security",
  },
  // partialPrefetching 依赖 cacheComponents，一并关闭
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
