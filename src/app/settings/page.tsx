import { DeviceSettings } from '@/components/auth';
import { UserInfo } from '@/components/settings/UserInfo';

export const metadata = { title: 'Settings - Rodeo Companion' } as const;

export default function Page() {
  return (
    <section className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-6">
        <UserInfo />
        <DeviceSettings />
      </div>
    </section>
  );
}
