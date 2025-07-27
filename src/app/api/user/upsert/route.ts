import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Device, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const schema = z.object({
  deviceId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid device ID format',
  }),
  publicId: z.string().trim().min(1, 'publicId is required'),
  displayName: z.string().trim().min(1, 'displayName is required'),
});

type DupKeyErr = {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
};

function isDuplicateKeyError(err: unknown): err is DupKeyErr {
  return !!err && typeof err === 'object' && (err as DupKeyErr).code === 11000;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { deviceId, publicId, displayName } = parsed.data;

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
      if (isDuplicateKeyError(err)) {
        // Tell which field(s) conflicted if available
        const fields = (err.keyPattern && Object.keys(err.keyPattern)) ||
          (err.keyValue && Object.keys(err.keyValue)) || ['unknown'];
        return NextResponse.json({ conflict: true, fields }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true, user: { publicId, displayName } });
  } catch (error) {
    console.error('User upsert error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
