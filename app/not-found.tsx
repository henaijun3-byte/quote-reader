import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-serif-cjk text-6xl text-zinc-700">404</h1>
      <p className="text-zinc-400 text-sm">没有这个人，也没有这一页</p>
      <Link
        href="/"
        className="text-zinc-500 hover:text-zinc-300 text-sm underline underline-offset-4 transition-colors"
      >
        ← 返回首页
      </Link>
    </main>
  );
}
