'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const metadata = { title: 'Home - Rodeo' } as const;

export default function HomePage() {
  const [displayName, setDisplayName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me');
      if (res.status === 401) {
        router.replace('/');
        return;
      }
      const data = await res.json();
      if (data.user?.displayName) {
        setDisplayName(data.user.displayName);
      } else if (data.deviceId) {
        // if user missing, redirect to landing
        router.replace('/');
      }
    })();
  }, [router]);

  return (
    <section className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Hi, {displayName}</h1>
      <div className="grid grid-cols-2 gap-4">
        <a href="/scores" className="rounded bg-gray-100 p-4">
          Scores
        </a>
        <a href="/schedule" className="rounded bg-gray-100 p-4">
          Schedule
        </a>
        <a href="/competitors" className="rounded bg-gray-100 p-4">
          Competitors
        </a>
        <a href="/shop" className="rounded bg-gray-100 p-4">
          Shop
        </a>
      </div>
    </section>
  );
}
