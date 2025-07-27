import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { signSessionCookie, verifySignature } from '@/lib/crypto';
import { Challenge, Device, Session } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const verifySchema = z.object({
  deviceId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid device ID format',
  }),
  challengeId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid challenge ID format',
  }),
  signature: z.string().min(1, 'Signature is required'),
});

const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, challengeId, signature } = verifySchema.parse(body);

    await connectToDatabase();

    // Find device and challenge
    const [device, challenge] = await Promise.all([
      Device.findById(deviceId),
      Challenge.findById(challengeId),
    ]);

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      );
    }

    // Check if device is locked
    if (device.status !== 'active') {
      const statusCode = device.status === 'locked' ? 423 : 403;
      return NextResponse.json(
        { error: `Device is ${device.status}` },
        { status: statusCode },
      );
    }

    // Check challenge validity
    if (challenge.consumedAt) {
      await incrementFailedAttempts(device);
      return NextResponse.json(
        { error: 'Challenge already consumed' },
        { status: 400 },
      );
    }

    if (new Date() > challenge.expiresAt) {
      await incrementFailedAttempts(device);
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    if (!challenge.deviceId.equals(device._id)) {
      await incrementFailedAttempts(device);
      return NextResponse.json(
        { error: 'Challenge does not belong to device' },
        { status: 400 },
      );
    }

    // Verify signature
    const isValidSignature = await verifySignature(
      device.publicKeyJwk,
      challenge.nonce,
      signature,
    );

    if (!isValidSignature) {
      await incrementFailedAttempts(device);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Success! Reset failed attempts and create session
    device.failedAttempts = 0;
    device.lastSeenAt = new Date();
    device.lastIp =
      request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    device.userAgent = request.headers.get('user-agent') || 'unknown';
    await device.save();

    // Mark challenge as consumed
    challenge.consumedAt = new Date();
    await challenge.save();

    // Create session
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const session = new Session({
      deviceId: device._id,
      expiresAt,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    await session.save();

    // Create signed session cookie
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    const signedCookie = await signSessionCookie(
      session._id.toString(),
      sessionSecret,
    );

    // Set secure HTTP-only cookie
    const response = NextResponse.json({ ok: true });

    response.cookies.set('sid', signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signature verification error:', error);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementFailedAttempts(device: any) {
  device.failedAttempts += 1;

  if (device.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    device.status = 'locked';
  }

  await device.save();
}
