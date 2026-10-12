# 垂直沉浸式阅读器

只收录单个人物语录的沉浸式阅读 Web App：干净、专注、带阅读进度记忆。

- 单条语录一页，居中大字，深色沉浸
- 四通道翻页：按钮 / 键盘 ←→ / 桌面点击左右热区 / 移动端左右滑动
- 阅读进度自动记忆（localStorage，无需登录），落地页一键「继续阅读」
- 字号三档可调，顶/底栏静置 2.5s 自动隐藏
- 无登录、无后台、无社交功能——只有语录

## 技术栈

Next.js（App Router）+ TypeScript · Tailwind CSS v4 · Supabase（PostgreSQL）

架构要点：语录是公开只读的小数据，**Server Components 直读 Supabase 全量下发**（无 Route Handlers），翻页零网络请求；进度存 localStorage，Supabase 不参与账号体系。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 创建 Supabase 项目（约 2 分钟）

1. [supabase.com](https://supabase.com) 注册 → New project → 记下密码
2. 进入项目 → **SQL Editor** → 粘贴 `supabase/schema.sql` → Run
3. 再粘贴 `supabase/seed.sql` → Run
4. **Table Editor** 中应看到 `people` 1 行（鲁迅）、`quotes` 45 行

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

在 [Dashboard → Settings → API](https://supabase.com/dashboard) 找到 Project URL 和 anon public key，填入 `.env.local`。

### 4. 启动

```bash
npm run dev
```

打开 http://localhost:3000 —— 落地页显示鲁迅资料，点「开始阅读」进入沉浸阅读。

## 阅读交互

| 操作 | 效果 |
| --- | --- |
| 键盘 ← → | 上/下一则（Escape 返回首页） |
| 点击页面左右 30% 区域 | 上/下一则 |
| 点击中间 40% 区域 | 唤出/隐藏顶部和底部栏 |
| 移动端左右滑动 | 翻页（上下滑动正常滚动长语录） |
| 顶栏「小/中/大」 | 字号三档，自动记忆 |

进度记忆：翻页即存 localStorage（`quote-reader:progress:v1`），刷新/重开浏览器不丢；`?q=N` 可深链到第 N 则（1-based）。

## 换一个人物（只改数据，不改代码）

1. 修改 `supabase/seed.sql`：换掉 person 的 slug/name/bio，替换全部语录（保留 `(n, content, source)` 结构）
2. SQL Editor 重跑 seed.sql（幂等：人物 upsert + 旧语录清空重插）
3. 访问 `/read/<新 slug>` 即可；生产环境最多 1 小时后自动生效（ISR），或 Vercel Redeploy 立即生效

## 部署（Vercel）

1. 推送到 GitHub → Vercel 导入仓库（Next.js 自动识别，零配置）
2. 环境变量（Production + Preview 都加，**无 NEXT_PUBLIC_ 前缀**）：
   - `SUPABASE_URL`、`SUPABASE_ANON_KEY`
3. Deploy 完成即上线

注意：Supabase 免费层项目连续 7 天无 API 活动会被暂停（Dashboard 一键恢复，数据保留）。

## 项目结构

```
app/
  page.tsx              落地页（Server）：人物信息 + 进度感知按钮
  read/[slug]/page.tsx  阅读页 Server 外壳：取数、404、?q= 解析
  read/[slug]/reader.tsx 阅读页客户端核心：全部交互
components/
  ProgressBar.tsx       顶部 2px 进度条
  TapZones.tsx          左右 30% 点击/滑动热区
  ReaderChrome.tsx      header/footer（返回、字号、计数、翻页按钮）
  ProgressCta.tsx       落地页「开始/继续阅读」
lib/
  quotes.ts             数据访问层（Server Components 直读 Supabase）
  progress.ts           localStorage 进度读写
  settings.ts           字号偏好
  useSwipe.ts           横向滑动手势 hook
supabase/
  schema.sql            建表 + RLS（只读）
  seed.sql              种子数据：鲁迅 + 45 则语录（可重播）
```
