'use client';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth';
import {
  ensureDeviceKeys,
  getStoredPrivateKeyJWK,
} from '@/lib/client/keyManager';
import { generateJWKThumbprint } from '@/lib/crypto';
import { formatPublicId, makeDisplayName } from '@/lib/identity';

export function LandingPreview() {
  const [publicId, setPublicId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      await ensureDeviceKeys();
      const jwk = await getStoredPrivateKeyJWK();
      if (!jwk) return;
      const thumbprint = await generateJWKThumbprint({
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
      });
      setPublicId(formatPublicId(thumbprint));
      setDisplayName(makeDisplayName(thumbprint));
    })();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-xl font-semibold">{displayName}</p>
      <p className="text-sm text-gray-500">Public ID: {publicId}</p>
      <AuthButton />
    </div>
  );
}
