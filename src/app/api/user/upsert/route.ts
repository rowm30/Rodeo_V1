import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Device, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const schema = z.object({
  deviceId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  publicId: z.string().min(1),
  displayName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, publicId, displayName } = schema.parse(body);

    await connectToDatabase();

    const device = await Device.findById(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    let user = await User.findOne({ deviceId });
    if (!user) {
      user = new User({ deviceId, publicId, displayName });
    } else {
      user.publicId = publicId;
      user.displayName = displayName;
    }

    try {
      await user.save();
    } catch (err: unknown) {
      const e = err as { code?: number; keyPattern?: Record<string, unknown> };
      if (e.code === 11000 && e.keyPattern?.displayName) {
        // conflict on displayName
        return NextResponse.json({ conflict: true });
      }
      throw err;
    }

    return NextResponse.json({ ok: true, user: { publicId, displayName } });
  } catch (error) {
    console.error('User upsert error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
