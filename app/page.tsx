import { getPersonBySlug, getQuotesByPerson } from "@/lib/quotes";
import { ProgressCta } from "@/components/ProgressCta";

export default async function HomePage() {
  const person = await getPersonBySlug("luxun");

  if (!person) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-zinc-200 text-lg">数据库尚未初始化</p>
        <p className="text-zinc-500 text-sm max-w-md text-center leading-relaxed">
          请按 README 步骤创建 Supabase 项目，并在 SQL Editor
          中依次运行 supabase/schema.sql 与 supabase/seed.sql。
        </p>
      </main>
    );
  }

  const quotes = await getQuotesByPerson(person.id);
  const total = quotes.length;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6 py-16">
      <section className="flex flex-col items-center gap-4 text-center max-w-xl">
        <h1 className="text-4xl md:text-5xl font-serif-cjk tracking-widest text-zinc-100">
          {person.name}
        </h1>
        {person.birth_year && person.death_year && (
          <p className="text-zinc-500 text-sm tracking-[0.2em]">
            {person.birth_year} — {person.death_year}
          </p>
        )}
        {person.bio && (
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            {person.bio}
          </p>
        )}
        <p className="text-zinc-600 text-sm mt-2">共 {total} 则语录</p>
      </section>

      <ProgressCta slug={person.slug} total={total} />
    </main>
  );
}
