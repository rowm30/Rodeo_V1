import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateJWKThumbprint, validateECDSAP256JWK } from '@/lib/crypto';
import { Device } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

const registerSchema = z.object({
  publicKeyJwk: z.any().refine(validateECDSAP256JWK, {
    message: 'Invalid ECDSA P-256 public key JWK format',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKeyJwk } = registerSchema.parse(body);

    await connectToDatabase();

    // Generate thumbprint for deduplication
    const publicKeyThumbprint = await generateJWKThumbprint(publicKeyJwk);

    if (typeof publicKeyThumbprint !== 'string') {
      throw new Error('publicKeyThumbprint must be a string');
    }

    // Check if device already exists
    let device = await Device.findOne({ publicKeyThumbprint });

    if (!device) {
      // Create new device
      device = new Device({
        publicKeyJwk,
        publicKeyThumbprint,
        lastIp:
          request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      await device.save();
    } else {
      // Update existing device's last seen info
      device.lastSeenAt = new Date();
      device.lastIp =
        request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      device.userAgent = request.headers.get('user-agent') || 'unknown';
      await device.save();
    }

    return NextResponse.json({
      deviceId: device._id.toString(),
    });
  } catch (error) {
    console.error('Device registration error:', error);

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
