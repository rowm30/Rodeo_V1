import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import BottomTabs from '@/components/nav/BottomTabs';
import TopNav from '@/components/nav/TopNav';
import ServiceWorker from '@/components/ServiceWorker';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'Rodeo Companion', template: '%s - Rodeo Companion' },
  description: 'Rodeo Companion App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TopNav />
        <main className="min-h-screen pb-14">{children}</main>
        <footer className="border-t py-4 text-center">
          © Rodeo Companion
        </footer>
        <BottomTabs />
        <ServiceWorker />
      </body>
    </html>
  );
}
