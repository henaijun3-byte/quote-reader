import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "语录 · 沉浸阅读",
    template: "%s · 沉浸阅读",
  },
  description: "只收录单个人物语录的沉浸式阅读器：干净、专注、带阅读进度记忆。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
