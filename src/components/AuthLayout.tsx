'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || !token)) {
      router.push('/login');
    }
  }, [user, token, isLoading, router]);

  // На сервере или во время гидрации показываем простой лоадер
  if (!isClient) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Завантаження...</div>
      </div>
    );
  }

  if (!user || !token) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  const navigation = [
    { name: 'Профіль', href: '/profile' },
    { name: 'Турніри', href: '/tournaments' },
    { name: 'Ліги', href: '/leagues' },
    { name: 'Швейцарка', href: '/swiss' },
    ...(user?.role === 'ADMIN' ? [
      { 
        name: 'Управління групами та атрибутами',
        href: '/admin/groups-attributes',
        children: [
          { name: 'Управління атрибутами', href: '/admin/groups-attributes/attributes' },
          { name: 'Паттон', href: '/admin/groups-attributes/patton' }
        ]
      }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="flex flex-col h-screen">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Турнірний застосунок</h2>
              <p className="text-sm text-gray-500 mt-1">{user.username}</p>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      {item.children ? (
                        <div>
                          <div className="px-4 py-2 text-sm font-medium text-gray-500 mb-1">{item.name}</div>
                          <ul className="ml-4 space-y-1">
                            {item.children.map((child) => {
                              const isChildActive = pathname === child.href;
                              return (
                                <li key={child.name}>
                                  <Link
                                    href={child.href}
                                    className={`block px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border-l-4 ${
                                      isChildActive
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-sm'
                                        : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm'
                                    }`}
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`block px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border-l-4 ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-sm'
                              : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm'
                          }`}
                        >
                          {item.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-4">
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
} 