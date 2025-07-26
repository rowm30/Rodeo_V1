'use client';

import React from 'react';
import { AuthButton } from '@/components/auth';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Rodeo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure device-based authentication
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <AuthButton />
          <div className="text-center">
            <p className="text-xs text-gray-500">
              No personal information required. Your device generates a unique cryptographic key for secure access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}