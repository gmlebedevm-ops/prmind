'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Menu, Bell, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Закрывать пользовательское меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Меню для мобильных устройств */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Логотип и название */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PM</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">ProjectMind</h1>
            <p className="text-xs text-muted-foreground hidden sm:block truncate">
              Управление проектами с AI
            </p>
          </div>
        </div>

        {/* Разделитель */}
        <div className="flex-1" />

        {/* Переключатель темы */}
        <ThemeToggle />

        {/* Уведомления */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            3
          </Badge>
        </Button>

        {/* Пользовательское меню */}
        <div className="relative user-menu-container">
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user ? getInitials(user.name || '', user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover shadow-lg user-menu-container">
              <div className="p-4 border-b">
                <p className="font-medium text-sm truncate">
                  {user?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {user?.role || 'Пользователь'}
                </Badge>
              </div>
              <div className="p-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: Открыть настройки
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-8 text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}