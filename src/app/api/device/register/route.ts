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

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xv = req.headers.get('x-vercel-forwarded-for');
  if (xv) return xv.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr;
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { publicKeyJwk } = parsed.data;

    await connectToDatabase();

    // Generate thumbprint for deduplication
    const publicKeyThumbprint = await generateJWKThumbprint(publicKeyJwk);
    if (typeof publicKeyThumbprint !== 'string') {
      throw new Error('publicKeyThumbprint must be a string');
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create or update device
    let device = await Device.findOne({ publicKeyThumbprint });

    if (!device) {
      device = new Device({
        publicKeyJwk,
        publicKeyThumbprint,
        lastSeenAt: new Date(),
        lastIp: ip,
        userAgent,
      });
      await device.save();
    } else {
      device.lastSeenAt = new Date();
      device.lastIp = ip;
      device.userAgent = userAgent;
      await device.save();
    }

    return NextResponse.json({ deviceId: device._id.toString() });
  } catch (error) {
    console.error('Device registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
