'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAIChat } from '@/hooks/use-ai-chat';
import { 
  Home, 
  FolderOpen, 
  ListTodo, 
  BarChart3, 
  Calendar, 
  GanttChart, 
  Users, 
  MessageSquare, 
  Settings, 
  Brain,
  Bell,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIChat?: () => void;
  user?: {
    role: string;
  };
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Главная',
    href: '/',
    icon: Home,
  },
  {
    title: 'Проекты',
    href: '/projects',
    icon: FolderOpen,
    badge: '6',
  },
  {
    title: 'Задачи',
    href: '/tasks',
    icon: ListTodo,
    badge: '12',
  },
  {
    title: 'Чек-лист',
    href: '/checklist',
    icon: ListTodo,
  },
  {
    title: 'Календарь',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Гант-диаграмма',
    href: '/gantt',
    icon: GanttChart,
  },
  {
    title: 'Аналитика',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'AI-ассистент',
    href: '#',
    icon: Brain,
  },
  {
    title: 'Настройки',
    href: '/settings',
    icon: Settings,
    children: [
      {
        title: 'Общие',
        href: '/settings',
        icon: Settings,
      },
      {
        title: 'Профиль',
        href: '/settings/profile',
        icon: Users,
      },
      {
        title: 'Уведомления',
        href: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Настройки AI',
        href: '/ai-settings',
        icon: Brain,
      },
      {
        title: 'Администрирование',
        href: '/admin',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({ isOpen, onClose, onOpenAIChat, user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Автоматически разворачиваем меню настроек при переходе на страницы настроек
  React.useEffect(() => {
    const isSettingsPage = pathname.startsWith('/settings') || 
                          pathname === '/ai-settings' || 
                          pathname === '/admin';
    
    if (isSettingsPage) {
      setExpandedItems(prev => {
        if (!prev.includes('/settings')) {
          return [...prev, '/settings'];
        }
        return prev;
      });
    }
  }, [pathname]);

  // Фильтруем пункты меню в зависимости от роли пользователя
  const filteredNavItems = navItems.map(item => {
    // Если это раздел "Настройки", фильтруем его дочерние элементы
    if (item.title === 'Настройки' && item.children) {
      return {
        ...item,
        children: item.children.filter(child => {
          // Скрываем администрирование для не-администраторов
          if (child.title === 'Администрирование' && user?.role !== 'ADMIN') {
            return false;
          }
          return true;
        })
      };
    }
    return item;
  });

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const NavItemComponent = ({ item, level = 0, isChildOfSettings = false }: { item: NavItem; level?: number; isChildOfSettings?: boolean }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);
    const isAIAssistant = item.title === 'AI-ассистент';

    return (
      <div className="w-full">
        {isAIAssistant ? (
          <Button
            variant="ghost"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground min-w-0 w-full',
              active && 'bg-accent text-accent-foreground',
              level > 0 && 'ml-4'
            )}
            onClick={() => {
              onOpenAIChat?.();
              onClose();
            }}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {item.badge}
              </Badge>
            )}
          </Button>
        ) : (
          <Link
            href={hasChildren ? '#' : item.href}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleExpanded(item.href);
              } else {
                // Не закрываем меню, если это элемент из раздела Настроек
                const isSettingsItem = item.title === 'Настройки' || 
                                    isChildOfSettings || 
                                    item.href.startsWith('/settings') ||
                                    item.href.startsWith('/ai-settings') ||
                                    item.href.startsWith('/admin');
                
                if (!isSettingsItem) {
                  onClose();
                }
              }
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground min-w-0',
              active && 'bg-accent text-accent-foreground',
              level > 0 && 'ml-4'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-auto p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpanded(item.href);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </Link>
        )}
        
        {hasChildren && isExpanded && !isAIAssistant && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <NavItemComponent 
                key={child.href} 
                item={child} 
                level={level + 1}
                isChildOfSettings={item.title === 'Настройки'}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Оверлей для мобильных устройств */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Боковая панель */}
      <div
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:w-64 lg:shrink-0 lg:transform-none lg:translate-x-0 lg:fixed lg:top-16 lg:left-0 lg:z-30 lg:bottom-0'
        )}
      >
        <ScrollArea className="h-full py-4">
          <div className="px-3 space-y-1">
            {filteredNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
          
          {/* Разделитель */}
          <div className="px-3 py-4">
            <div className="border-t" />
          </div>
          
          {/* Информация о системе */}
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="truncate">Система активна</span>
              </div>
              <div className="truncate">Версия 1.0.0</div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}