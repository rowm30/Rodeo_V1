import { Types } from 'mongoose';
import { cookies } from 'next/headers';

import { verifySessionCookie } from '@/lib/crypto';
import { Session, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

type MeResponse = {
  authenticated: boolean;
  deviceId?: string;
  user?: { displayName: string; publicId: string };
};

export async function getMeServer(): Promise<MeResponse> {
  await connectToDatabase();

  // In Next.js 15, cookies() can be async; await before .get(...)
  const cookieStore = await cookies();
  const sid = cookieStore.get('sid')?.value ?? null;

  const secret = process.env.SESSION_SECRET ?? null;
  if (!sid || !secret) return { authenticated: false };

  const sessionId = await verifySessionCookie(sid, secret);
  if (!sessionId) return { authenticated: false };

  const session = await Session.findById(sessionId)
    .select('deviceId expiresAt revokedAt')
    .lean<{ deviceId: Types.ObjectId; expiresAt: Date; revokedAt?: Date }>()
    .exec();

  if (
    !session ||
    session.revokedAt ||
    new Date() > new Date(session.expiresAt)
  ) {
    return { authenticated: false };
  }

  const deviceIdStr = session.deviceId?.toString();

  const userDoc = await User.findOne({ deviceId: session.deviceId })
    .select('displayName publicId')
    .lean<{ displayName: string; publicId: string }>()
    .exec();

  if (!userDoc) {
    return {
      authenticated: true,
      deviceId: deviceIdStr,
    };
  }

  return {
    authenticated: true,
    deviceId: deviceIdStr,
    user: {
      displayName: userDoc.displayName,
      publicId: userDoc.publicId,
    },
  };
}
