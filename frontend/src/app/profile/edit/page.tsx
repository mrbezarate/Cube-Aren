'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-arena-dark flex items-center justify-center">
      <div className="text-white font-orbitron">Перенаправление...</div>
    </div>
  );
}
