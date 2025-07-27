import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateNonce } from '@/lib/crypto';
import { Challenge, Device } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const challengeSchema = z.object({
  deviceId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid device ID format',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId } = challengeSchema.parse(body);

    await connectToDatabase();

    // Verify device exists and is active
    const device = await Device.findById(deviceId);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.status !== 'active') {
      const statusCode = device.status === 'locked' ? 423 : 403;
      return NextResponse.json(
        { error: `Device is ${device.status}` },
        { status: statusCode },
      );
    }

    // Generate challenge
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const challenge = new Challenge({
      deviceId: new mongoose.Types.ObjectId(deviceId),
      nonce,
      expiresAt,
    });

    await challenge.save();

    return NextResponse.json({
      challengeId: challenge._id.toString(),
      nonce,
    });
  } catch (error) {
    console.error('Challenge creation error:', error);

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
