import React from 'react';
import Image from 'next/image';
import leftBanner from '../../public/left.jpg';
import rightBanner from '../../public/right.jpg';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex w-full bg-gray-100">
      {/* Left Banner Space */}
      <div className="hidden lg:block w-[10%] sticky top-0 h-screen">
        <Image 
          src={leftBanner}
          alt="Left Banner"
          placeholder="blur"
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <main className="w-full lg:w-[80%] min-h-screen bg-white shadow-md px-6 py-4">
        {children}
      </main>

      {/* Right Banner Space */}
      <div className="hidden lg:block w-[10%] sticky top-0 h-screen">
        <Image 
          src={rightBanner}
          alt="Right Banner"
          placeholder="blur"
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </div>
  );
}; 