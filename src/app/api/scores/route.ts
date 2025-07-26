import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    scores: [
      {
        contestant: 'Jane Doe',
        event: 'calf-roping',
        value: 7.5,
        unit: 'seconds',
      },
    ],
  });
}
