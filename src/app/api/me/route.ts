import { NextRequest, NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/crypto';
import { Session, User } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    // Get session cookie
    const signedCookie = request.cookies.get('sid')?.value;
    if (!signedCookie) {
      return NextResponse.json(
        { error: 'No session cookie found' },
        { status: 401 },
      );
    }

    // Verify and extract session ID
    const sessionId = await verifySessionCookie(signedCookie, sessionSecret);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Invalid session cookie' },
        { status: 401 },
      );
    }

    // Find and validate session
    const session = await Session.findById(sessionId).populate('deviceId');
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    if (session.revokedAt) {
      return NextResponse.json({ error: 'Session revoked' }, { status: 401 });
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = await User.findOne({ deviceId: session.deviceId._id });

    return NextResponse.json({
      authenticated: true,
      deviceId: session.deviceId._id.toString(),
      user: user
        ? { publicId: user.publicId, displayName: user.displayName }
        : null,
      sessionInfo: {
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Authentication check error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
