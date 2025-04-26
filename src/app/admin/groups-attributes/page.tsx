'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

export default function GroupsAttributesPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/profile');
    } else {
      router.push('/admin/groups-attributes/attributes');
    }
  }, [user, router]);

  return (
    <AuthLayout>
      <div>Redirecting...</div>
    </AuthLayout>
  );
} 