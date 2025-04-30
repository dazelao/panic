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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Donetsk1y tournaments</h2>
              <div className="mt-2 flex items-center justify-between">
                <div className="px-2 py-1 bg-blue-50 border border-blue-400 rounded-md">
                  <p className="text-xs text-blue-600 font-medium">{user.username}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-md transition-colors"
                >
                  Вихід
                </button>
              </div>
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
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="w-full bg-gray-100 border-t px-4 py-2 text-[10px] text-gray-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative">
          <p>Продукт створено виключно для добровольчих цілей.</p>
          <Link 
            href="/tommy" 
            className="absolute left-1/2 -translate-x-1/2 w-6 h-full opacity-0 hover:opacity-100 text-blue-600 flex items-center justify-center transition-opacity"
          >
            1
          </Link>
          <p className="italic">Права шакалів не захищені</p>
        </div>
      </div>
    </div>
  );
} 