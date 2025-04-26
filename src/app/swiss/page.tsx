'use client';

import AuthLayout from '@/components/AuthLayout';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SwissPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Швейцарська система</h1>
        {/* Здесь будет основной контент страницы */}
      </div>
    </AuthLayout>
  );
} 