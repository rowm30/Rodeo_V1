'use client';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth';
import { generateJWKThumbprint } from '@/lib/crypto';
import { formatPublicId, makeDisplayName } from '@/lib/identity';

export function LandingPreview() {
  const [publicId, setPublicId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { ensureDeviceKeys } = await import('@/lib/client/keyManager');
      const { publicKeyJwk } = await ensureDeviceKeys();
      const thumbprint = await generateJWKThumbprint({
        crv: publicKeyJwk.crv,
        kty: publicKeyJwk.kty,
        x: publicKeyJwk.x,
        y: publicKeyJwk.y,
      });
      if (!mounted) return;
      setPublicId(formatPublicId(thumbprint));
      setDisplayName(makeDisplayName(thumbprint));
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-xl font-semibold">{displayName}</p>
      <p className="text-sm text-gray-500">Public ID: {publicId}</p>
      <AuthButton />
    </div>
  );
}
