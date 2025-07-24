import clientPromise from '@/lib/mongodb';

// This is a Server Component, so we can use async/await directly.
async function getGreeting() {
  try {
    const client = await clientPromise;
    const db = client.db(); // The database is inferred from your MONGODB_URI

    const greeting = await db
      .collection('greetings')
      .findOne({}); // Find the first document

    // The result from the DB is a full document.
    // We need to convert it to a plain object to pass to the client component.
    // Also, the `_id` field is a special BSON type, so we stringify it.
    if (greeting) {
      return {
        message: greeting.message,
        _id: greeting._id.toString(),
      };
    }
    return { message: 'Greeting not found.' };
  } catch (e) {
    console.error(e);
    // In a real app, you'd handle this error more gracefully
    return { message: 'Failed to fetch greeting.' };
  }
}

// The main page component is also async
export default async function Home() {
  // We call our data-fetching function and await the result
  const greetingData = await getGreeting();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-5xl font-bold mb-4">Next.js & MongoDB</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <p className="text-2xl">Message from DB:</p>
          <p className="text-4xl font-bold text-cyan-400 mt-2">
            {greetingData.message}
          </p>
        </div>
      </div>
    </main>
    
  );
}
