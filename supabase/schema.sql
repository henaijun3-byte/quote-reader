-- 垂直沉浸式阅读器 · 数据库结构（跑一次即可，幂等）
-- 用法：Supabase Dashboard → SQL Editor → 粘贴本文件 → Run

-- 人物表：垂直领域的最小单元，换人物 = 换 seed 数据，表结构不变
create table if not exists public.people (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,          -- URL 标识，如 'luxun'
  name       text not null,                 -- 展示名，如 '鲁迅'
  bio        text,                          -- 简介（落地页展示）
  avatar_url text,                          -- 可选头像
  birth_year int,
  death_year int,
  created_at timestamptz not null default now()
);

-- 语录表：content 正文、source 出处、sort_order 定序、note 备用（如「节录」）
create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  content    text not null,
  source     text,                          -- 出处，如《呐喊·故乡》
  note       text,
  sort_order int  not null,
  created_at timestamptz not null default now(),
  constraint quotes_person_order_unique unique (person_id, sort_order)  -- seed 幂等重播的锚点
);

create index if not exists quotes_person_sort_idx
  on public.quotes (person_id, sort_order);

-- RLS：匿名只读，禁止一切写入（无登录场景，anon 即唯一访问者）
alter table public.people enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "people_public_read" on public.people;
create policy "people_public_read" on public.people for select using (true);

drop policy if exists "quotes_public_read" on public.quotes;
create policy "quotes_public_read" on public.quotes for select using (true);

revoke insert, update, delete on public.people from anon, authenticated;
revoke insert, update, delete on public.quotes from anon, authenticated;
