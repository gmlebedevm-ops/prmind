'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAIChat } from '@/hooks/use-ai-chat';
import { useAIChatFullscreen } from '@/hooks/use-ai-chat-fullscreen';
import { AIChatDialog } from '@/components/ai/ai-chat-dialog';
import { AIChatFullscreen } from '@/components/ai/ai-chat-fullscreen';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, openChat, closeChat } = useAIChat();
  const { isOpen: isFullscreenOpen, openChat: openFullscreenChat, closeChat: closeFullscreenChat } = useAIChatFullscreen();

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
          onOpenAIChat={openFullscreenChat}
          user={user}
        />
        
        {/* Основной контент */}
        <div className="flex-1 lg:ml-64">
          <main className="h-[calc(100vh-4rem)] overflow-hidden">
            {/* Мобильный оверлей для контента при открытом меню */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Показываем либо основной контент, либо полноэкранный чат */}
            {isFullscreenOpen ? (
              <AIChatFullscreen
                onClose={closeFullscreenChat}
              />
            ) : (
              <div className="h-full overflow-auto">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* AI Chat Dialog (старый модальный вариант) */}
      <AIChatDialog open={isOpen} onOpenChange={closeChat} />
    </div>
  );
}