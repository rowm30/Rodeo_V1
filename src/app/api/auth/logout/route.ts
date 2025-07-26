import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Session } from '@/lib/models';
import { verifySessionCookie } from '@/lib/crypto';

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
      return NextResponse.json({ ok: true }); // Already logged out
    }

    // Verify and extract session ID
    const sessionId = verifySessionCookie(signedCookie, sessionSecret);
    if (sessionId) {
      // Revoke session
      await Session.findByIdAndUpdate(sessionId, {
        revokedAt: new Date(),
      });
    }

    // Clear cookie
    const response = NextResponse.json({ ok: true });
    response.cookies.delete('sid');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear the cookie even if there's an error
    const response = NextResponse.json({ ok: true });
    response.cookies.delete('sid');

    return response;
  }
}