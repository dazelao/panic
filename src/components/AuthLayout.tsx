'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  // Refs для заголовка
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  // Refs для первого слова (Donetsk1y)
  const d1Ref = useRef<HTMLSpanElement>(null);
  const o1Ref = useRef<HTMLSpanElement>(null);
  const n1Ref = useRef<HTMLSpanElement>(null);
  const e1Ref = useRef<HTMLSpanElement>(null);
  const t1Ref = useRef<HTMLSpanElement>(null);
  const s1Ref = useRef<HTMLSpanElement>(null);
  const k1Ref = useRef<HTMLSpanElement>(null);
  const oneRef = useRef<HTMLSpanElement>(null);
  const y1Ref = useRef<HTMLSpanElement>(null);
  
  // Refs для второго слова (tournaments)
  const t2Ref = useRef<HTMLSpanElement>(null);
  const o2Ref = useRef<HTMLSpanElement>(null);
  const u2Ref = useRef<HTMLSpanElement>(null);
  const r2Ref = useRef<HTMLSpanElement>(null);
  const n2Ref = useRef<HTMLSpanElement>(null);
  const a2Ref = useRef<HTMLSpanElement>(null);
  const m2Ref = useRef<HTMLSpanElement>(null);
  const e2Ref = useRef<HTMLSpanElement>(null);
  const n3Ref = useRef<HTMLSpanElement>(null);
  const t3Ref = useRef<HTMLSpanElement>(null);
  const s2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || !token)) {
      router.push('/login');
    }
  }, [user, token, isLoading, router]);
  
  // Эффект для анимации заголовка
  useEffect(() => {
    if (!isClient || !titleRef.current) return;
    
    // Задержка для уверенности, что элементы отрендерены
    const timeout = setTimeout(() => {
      // Устанавливаем начальные стили
      gsap.set([d1Ref.current, o1Ref.current, n1Ref.current, e1Ref.current, t1Ref.current, 
                s1Ref.current, k1Ref.current, oneRef.current, y1Ref.current], {
        color: "#2563eb", // синий
        textShadow: "none"
      });
      
      gsap.set([t2Ref.current, o2Ref.current, u2Ref.current, r2Ref.current, n2Ref.current, 
                a2Ref.current, m2Ref.current, e2Ref.current, n3Ref.current, t3Ref.current, s2Ref.current], {
        color: "#fbbf24", // желтый
        textShadow: "none"
      });
      
      // Начальная анимация появления заголовка
      const initialAnimation = gsap.timeline();
      initialAnimation
        .from(titleRef.current, {
          y: -20,
          opacity: 0,
          duration: 1,
          ease: "power3.out"
        })
        .from([d1Ref.current, o1Ref.current, n1Ref.current, e1Ref.current, t1Ref.current, 
              s1Ref.current, k1Ref.current, oneRef.current, y1Ref.current], {
          opacity: 0,
          stagger: 0.05,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.5")
        .from([t2Ref.current, o2Ref.current, u2Ref.current, r2Ref.current, n2Ref.current, 
              a2Ref.current, m2Ref.current, e2Ref.current, n3Ref.current, t3Ref.current, s2Ref.current], {
          opacity: 0,
          stagger: 0.05,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.2");
      
      // Группы букв для первого слова
      const firstWordLetters = [
        [d1Ref.current, o1Ref.current],       // DO
        [n1Ref.current, e1Ref.current],       // NE
        [t1Ref.current, s1Ref.current],       // TS
        [k1Ref.current, oneRef.current],      // K1
        [y1Ref.current]                       // Y
      ];
      
      // Группы букв для второго слова
      const secondWordLetters = [
        [t2Ref.current, o2Ref.current],       // TO
        [u2Ref.current, r2Ref.current],       // UR
        [n2Ref.current, a2Ref.current],       // NA
        [m2Ref.current, e2Ref.current],       // ME
        [n3Ref.current, t3Ref.current, s2Ref.current] // NTS
      ];
      
      // Функция для создания волновой анимации
      const createWaveAnimation = () => {
        const timeline = gsap.timeline();
        
        // Анимация первого слова (быстрее)
        const firstWordAnimation = gsap.timeline({repeat: 2}); // Повторяем анимацию первого слова 3 раза
        
        // Волна по первому слову (желтая) - быстрее
        firstWordLetters.forEach((group, index) => {
          firstWordAnimation.to(group, {
            color: "#fbbf24", // желтый
            fontWeight: "bold",
            scale: 1.5, // увеличиваем масштаб
            textShadow: "0 0 8px rgba(251, 191, 36, 0.7)",
            duration: 0.2, // быстрее
            stagger: 0.03, // быстрее
            ease: "power2.inOut"
          }, index * 0.1); // быстрее
          
          // Возвращаем цвет через небольшую задержку
          firstWordAnimation.to(group, {
            color: "#2563eb", // синий
            fontWeight: "semibold",
            scale: 1,
            textShadow: "none",
            duration: 0.2, // быстрее
            stagger: 0.03, // быстрее
            ease: "power2.inOut"
          }, index * 0.1 + 0.2); // быстрее
        });
        
        // Добавляем анимацию первого слова в основной таймлайн
        timeline.add(firstWordAnimation);
        
        // Небольшая пауза между анимациями слов
        timeline.to({}, { duration: 0.5 });
        
        // Анимация второго слова (медленнее)
        const secondWordAnimation = gsap.timeline();
        
        // Волна по второму слову (синяя) - медленнее
        secondWordLetters.forEach((group, index) => {
          secondWordAnimation.to(group, {
            color: "#2563eb", // синий
            fontWeight: "bold",
            scale: 1.7, // увеличиваем масштаб 
            textShadow: "0 0 10px rgba(37, 99, 235, 0.8)",
            duration: 0.4, // медленнее
            stagger: 0.07, // медленнее
            ease: "power2.inOut"
          }, index * 0.2); // медленнее
          
          // Возвращаем цвет через небольшую задержку
          secondWordAnimation.to(group, {
            color: "#fbbf24", // желтый
            fontWeight: "semibold",
            scale: 1,
            textShadow: "none",
            duration: 0.4, // медленнее
            stagger: 0.07, // медленнее
            ease: "power2.inOut"
          }, index * 0.2 + 0.4); // медленнее
        });
        
        // Добавляем анимацию второго слова в основной таймлайн
        timeline.add(secondWordAnimation);
        
        return timeline;
      };
      
      // Создаем основной таймлайн с волновой анимацией
      const waveTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 30 // Повторяем каждые 30 секунд
      });
      
      // Добавляем волновую анимацию в основной таймлайн повторения
      waveTimeline.add(createWaveAnimation());
      
      // Комбинируем обе анимации
      const masterTimeline = gsap.timeline();
      masterTimeline
        .add(initialAnimation) // Начальная анимация появления
        .add(createWaveAnimation(), "+=0.5") // Запускаем первую волну сразу после появления
        .add(waveTimeline, "+=1"); // Запускаем повторяющуюся волну с задержкой в 30 секунд
      
      // Сохраняем таймлайн для очистки
      return () => {
        if (masterTimeline) {
          masterTimeline.kill();
        }
      };
    }, 300); // Задержка
    
    return () => clearTimeout(timeout);
  }, [isClient]);

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
    { name: 'Регламент турніру', href: '/tommy' },
    ...(user?.role === 'ADMIN' ? [
      { name: 'Емулятор поля', href: '/field-simulator' },
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
              <h2 ref={titleRef} className="text-xl font-semibold flex flex-col">
                <span className="text-blue-600">
                  <span ref={d1Ref}>D</span>
                  <span ref={o1Ref}>o</span>
                  <span ref={n1Ref}>n</span>
                  <span ref={e1Ref}>e</span>
                  <span ref={t1Ref}>t</span>
                  <span ref={s1Ref}>s</span>
                  <span ref={k1Ref}>k</span>
                  <span ref={oneRef}>1</span>
                  <span ref={y1Ref}>y</span>
                </span>
                <span className="text-yellow-500">
                  <span ref={t2Ref}>t</span>
                  <span ref={o2Ref}>o</span>
                  <span ref={u2Ref}>u</span>
                  <span ref={r2Ref}>r</span>
                  <span ref={n2Ref}>n</span>
                  <span ref={a2Ref}>a</span>
                  <span ref={m2Ref}>m</span>
                  <span ref={e2Ref}>e</span>
                  <span ref={n3Ref}>n</span>
                  <span ref={t3Ref}>t</span>
                  <span ref={s2Ref}>s</span>
                </span>
              </h2>
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