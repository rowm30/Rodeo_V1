import { cookies } from 'next/headers';

import { verifySessionCookie } from '@/lib/crypto';
import { Session, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

export async function getMeServer(): Promise<{
  authenticated: boolean;
  deviceId?: string;
  user?: { displayName: string; publicId: string };
}> {
  await connectToDatabase();

  const sid = cookies().get('sid')?.value;
  const secret = process.env.SESSION_SECRET;
  if (!sid || !secret) return { authenticated: false };

  const sessionId = await verifySessionCookie(sid, secret);
  if (!sessionId) return { authenticated: false };

  const session = await Session.findById(sessionId).populate('deviceId').lean();
  if (!session || session.revokedAt || new Date() > session.expiresAt) {
    return { authenticated: false };
  }

  const userDoc = await User.findOne({ deviceId: session.deviceId }).lean();
  if (!userDoc) {
    return {
      authenticated: true,
      deviceId: session.deviceId?.toString(),
    };
  }

  return {
    authenticated: true,
    deviceId: session.deviceId?.toString(),
    user: {
      displayName: userDoc.displayName,
      publicId: userDoc.publicId,
    },
  };
}
