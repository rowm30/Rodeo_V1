'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/scores', label: 'Scores' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/competitors', label: 'Competitors' },
  { href: '/replays', label: 'Replays' },
  { href: '/map', label: 'Map' },
  { href: '/shop', label: 'Shop' },
  { href: '/settings', label: 'Settings' },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t bg-white sm:hidden dark:bg-black"
      aria-label="Bottom navigation"
    >
      <ul className="flex justify-around">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              className={clsx('block p-2', {
                'font-semibold text-blue-600': pathname === tab.href,
              })}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
