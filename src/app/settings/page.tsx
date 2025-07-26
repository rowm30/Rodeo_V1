import { DeviceSettings } from '@/components/auth';

export const metadata = { title: 'Settings - Rodeo Companion' } as const;

export default function Page() {
  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <DeviceSettings />
      </div>
    </section>
  );
}
