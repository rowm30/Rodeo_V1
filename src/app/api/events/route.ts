import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    events: [
      {
        id: 'mock-evt-1',
        name: 'Uvalde Rodeo 2025',
        startTime: new Date().toISOString(),
      },
    ],
  });
}
