import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { verifySessionCookie } from '@/lib/crypto';
import { Session, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const schema = z.object({
  deviceId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  publicId: z.string(),
  displayName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    const signedCookie = request.cookies.get('sid')?.value;
    if (!signedCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionId = await verifySessionCookie(signedCookie, sessionSecret);
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, publicId, displayName } = schema.parse(body);

    let attempt = 0;
    let finalName = displayName;
    while (attempt < 3) {
      try {
        const user = await User.findOneAndUpdate(
          { deviceId },
          { deviceId, publicId, displayName: finalName },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        return NextResponse.json({
          ok: true,
          user: { publicId: user.publicId, displayName: user.displayName },
        });
      } catch (err) {
        const mongoErr = err as {
          code?: number;
          keyPattern?: Record<string, unknown>;
        };
        if (mongoErr.code === 11000 && mongoErr.keyPattern?.displayName) {
          finalName = `${displayName}-${(attempt + 1).toString()}`;
          attempt += 1;
        } else {
          console.error('User upsert error:', err);
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ conflict: true }, { status: 409 });
  } catch (error) {
    console.error('User upsert error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
