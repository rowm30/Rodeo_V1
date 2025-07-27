export const metadata = { title: 'Rodeo Companion' };

export default function Home() {
  return (
    <section className="space-y-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Welcome to Rodeo</h1>
      <p className="text-sm">Secure device-based authentication</p>
      <a
        href="/home"
        className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-white"
      >
        Sign in with this device
      </a>
    </section>
  );
}
