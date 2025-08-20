'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Закрывать боковое меню при изменении размера окна для десктопа
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 pt-16">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
        
        {/* Основной контент */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-[calc(100vh-4rem)]">
            {/* Мобильный оверлей для контента при открытом меню */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}