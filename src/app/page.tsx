export const metadata = { title: 'Rodeo Companion' };
import { LandingPreview } from '@/components/home/LandingPreview';

export default function Home() {
  return (
    <section className="flex flex-col items-center space-y-6 p-4">
      <h1 className="text-3xl font-bold">Welcome to Rodeo</h1>
      <LandingPreview />
    </section>
  );
}
