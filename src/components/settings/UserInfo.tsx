'use client';
import { useEffect, useState } from 'react';

export function UserInfo() {
  const [info, setInfo] = useState<{
    displayName: string;
    publicId: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setInfo(data.user);
      }
    })();
  }, []);

  if (!info) return null;
  return (
    <div className="space-y-2">
      <div>
        Display Name: <span className="font-medium">{info.displayName}</span>
      </div>
      <div>
        Public ID: <span className="font-mono">{info.publicId}</span>
      </div>
    </div>
  );
}
