export const metadata = { title: 'Home - Rodeo Companion' } as const;

export default function Page() {
  return (
    <section className="grid grid-cols-2 gap-4 p-4 text-center">
      <a
        href="/scores"
        className="rounded-lg border p-8 font-semibold hover:bg-gray-50"
      >
        Scores
      </a>
      <a
        href="/schedule"
        className="rounded-lg border p-8 font-semibold hover:bg-gray-50"
      >
        Schedule
      </a>
      <a
        href="/competitors"
        className="rounded-lg border p-8 font-semibold hover:bg-gray-50"
      >
        Competitors
      </a>
      <a
        href="/shop"
        className="rounded-lg border p-8 font-semibold hover:bg-gray-50"
      >
        Shop
      </a>
    </section>
  );
}
