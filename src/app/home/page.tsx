import Link from 'next/link';

import { getMeServer } from '@/lib/server/me';

export const metadata = { title: 'Home - Rodeo' } as const;

export default async function HomePage() {
  const me = await getMeServer();
  const displayName = me?.user?.displayName ?? 'Rider';

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Hi, {displayName}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tile href="/scores" title="Scores" />
        <Tile href="/schedule" title="Schedule" />
        <Tile href="/competitors" title="Competitors" />
        <Tile href="/shop" title="Shop" />
      </div>
    </main>
  );
}

function Tile({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border p-6 transition hover:shadow-md"
    >
      <div className="text-xl font-medium">{title}</div>
    </Link>
  );
}
