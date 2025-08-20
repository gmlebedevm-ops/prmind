'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  CheckSquare,
  Clock,
  Target,
  Archive,
  Star,
  ChevronDown,
  ChevronRight,
  Bell,
  Plus
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
    children: [
      {
        title: 'Все проекты',
        href: '/projects',
        icon: FolderOpen,
      },
      {
        title: 'Создать проект',
        href: '/projects/create',
        icon: Plus,
      },
      {
        title: 'Архив',
        href: '/projects/archive',
        icon: Archive,
      },
    ],
  },
  {
    title: 'Задачи',
    href: '/tasks',
    icon: CheckSquare,
    badge: '12',
    children: [
      {
        title: 'Мои задачи',
        href: '/tasks/my',
        icon: CheckSquare,
      },
      {
        title: 'Все задачи',
        href: '/tasks',
        icon: ListTodo,
      },
      {
        title: 'Создать задачу',
        href: '/tasks/create',
        icon: Plus,
      },
    ],
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
    children: [
      {
        title: 'Дашборд',
        href: '/analytics',
        icon: BarChart3,
      },
      {
        title: 'Отчеты',
        href: '/analytics/reports',
        icon: FileText,
      },
      {
        title: 'Статистика',
        href: '/analytics/statistics',
        icon: Target,
      },
    ],
  },
  {
    title: 'Команда',
    href: '/team',
    icon: Users,
    children: [
      {
        title: 'Участники',
        href: '/team',
        icon: Users,
      },
      {
        title: 'Роли',
        href: '/team/roles',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Обсуждения',
    href: '/discussions',
    icon: MessageSquare,
    badge: '3',
  },
  {
    title: 'Время',
    href: '/time',
    icon: Clock,
    children: [
      {
        title: 'Трекер времени',
        href: '/time/tracker',
        icon: Clock,
      },
      {
        title: 'Отчеты по времени',
        href: '/time/reports',
        icon: FileText,
      },
    ],
  },
  {
    title: 'AI-ассистент',
    href: '/ai',
    icon: Brain,
    children: [
      {
        title: 'Чат с AI',
        href: '/ai',
        icon: MessageSquare,
      },
      {
        title: 'Настройки AI',
        href: '/ai-settings',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Избранное',
    href: '/favorites',
    icon: Star,
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
    ],
  },
  {
    title: 'Администрирование',
    href: '/admin',
    icon: Settings,
    badge: 'ADMIN',
  },
];

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Фильтруем пункты меню в зависимости от роли пользователя
  const filteredNavItems = navItems.filter(item => {
    // Скрываем администрирование для не-администраторов
    if (item.title === 'Администрирование' && user?.role !== 'ADMIN') {
      return false;
    }
    return true;
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

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div className="w-full">
        <Link
          href={hasChildren ? '#' : item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.href);
            } else {
              onClose();
            }
          }}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            active && 'bg-accent text-accent-foreground',
            level > 0 && 'ml-4'
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-auto p-0 hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </Link>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <NavItemComponent key={child.href} item={child} level={level + 1} />
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
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Система активна</span>
              </div>
              <div>Версия 1.0.0</div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}