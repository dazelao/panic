'use client';

import AuthLayout from '@/components/AuthLayout';
import { useParams } from 'next/navigation';
import React from 'react';

export default function SwissTournamentPage() {
  const params = useParams();
  const tournamentId = params.id;

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Турнір #{tournamentId}</h1>
        {/* Здесь будет контент конкретного турнира */}
      </div>
    </AuthLayout>
  );
} 