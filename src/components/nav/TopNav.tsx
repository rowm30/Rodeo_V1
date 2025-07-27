'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home' },
  { href: '/scores', label: 'Scores' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/competitors', label: 'Competitors' },
  { href: '/replays', label: 'Replays' },
  { href: '/map', label: 'Map' },
  { href: '/shop', label: 'Shop' },
  { href: '/settings', label: 'Settings' },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden border-b sm:block" aria-label="Main navigation">
      <ul className="flex space-x-4 p-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={clsx('px-2 py-1', {
                'font-bold text-blue-600': pathname === item.href,
              })}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
