import { NextRequest, NextResponse } from 'next/server';

import { signSessionCookie, verifySessionCookie } from '@/lib/crypto';
import { Session } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
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
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    if (session.revokedAt) {
      return NextResponse.json({ error: 'Session revoked' }, { status: 401 });
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Extend session
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    session.expiresAt = newExpiresAt;
    await session.save();

    // Create new signed cookie
    const newSignedCookie = await signSessionCookie(
      session._id.toString(),
      sessionSecret,
    );

    const response = NextResponse.json({
      ok: true,
      expiresAt: newExpiresAt.toISOString(),
    });

    response.cookies.set('sid', newSignedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session refresh error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
