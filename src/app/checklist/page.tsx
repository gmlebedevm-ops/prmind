'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  FolderOpen,
  CheckSquare,
  Calendar,
  BarChart3,
  Bot,
  Bell,
  Search,
  FileText,
  Smartphone,
  Plug,
  Palette,
  Settings,
  Zap,
  Shield,
  TestTube,
  BookOpen,
  Rocket
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

interface Task {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  tasks: Task[]
}

const categories: Category[] = [
  {
    id: 'auth',
    name: '🔐 Аутентификация и авторизация',
    icon: <Shield className="h-5 w-5" />,
    description: 'Управление доступом и безопасностью пользователей',
    tasks: []
  },
  {
    id: 'users',
    name: '👥 Управление пользователями',
    icon: <Users className="h-5 w-5" />,
    description: 'Администрирование пользователей и команд',
    tasks: []
  },
  {
    id: 'projects',
    name: '📁 Управление проектами',
    icon: <FolderOpen className="h-5 w-5" />,
    description: 'Создание и управление проектами',
    tasks: []
  },
  {
    id: 'tasks',
    name: '✅ Управление задачами',
    icon: <CheckSquare className="h-5 w-5" />,
    description: 'Полный цикл управления задачами',
    tasks: []
  },
  {
    id: 'tags',
    name: '🏷️ Теги и категории',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Организация и классификация контента',
    tasks: []
  },
  {
    id: 'comments',
    name: '💬 Комментарии и упоминания',
    icon: <FileText className="h-5 w-5" />,
    description: 'Система коммуникаций внутри задач',
    tasks: []
  },
  {
    id: 'time',
    name: '⏰ Учет времени',
    icon: <Clock className="h-5 w-5" />,
    description: 'Трекинг времени и аналитика производительности',
    tasks: []
  },
  {
    id: 'analytics',
    name: '📊 Аналитика и отчетность',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Анализ данных и генерация отчетов',
    tasks: []
  },
  {
    id: 'calendar',
    name: '📅 Календарь и планирование',
    icon: <Calendar className="h-5 w-5" />,
    description: 'Планирование событий и управление расписанием',
    tasks: []
  },
  {
    id: 'gantt',
    name: '📈 Гант-диаграммы',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Визуализация проектных таймлайнов',
    tasks: []
  },
  {
    id: 'ai',
    name: '🤖 AI-ассистент',
    icon: <Bot className="h-5 w-5" />,
    description: 'Интеллектуальные функции и автоматизация',
    tasks: []
  },
  {
    id: 'notifications',
    name: '📡 Уведомления',
    icon: <Bell className="h-5 w-5" />,
    description: 'Система оповещений и напоминаний',
    tasks: []
  },
  {
    id: 'search',
    name: '🔍 Поиск и фильтрация',
    icon: <Search className="h-5 w-5" />,
    description: 'Поиск по всем данным системы',
    tasks: []
  },
  {
    id: 'files',
    name: '📎 Файловый менеджер',
    icon: <FileText className="h-5 w-5" />,
    description: 'Управление файлами и документами',
    tasks: []
  },
  {
    id: 'mobile',
    name: '📱 Мобильная версия',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Адаптация для мобильных устройств',
    tasks: []
  },
  {
    id: 'integrations',
    name: '🌐 Интеграции',
    icon: <Plug className="h-5 w-5" />,
    description: 'Внешние сервисы и API',
    tasks: []
  },
  {
    id: 'ui',
    name: '🎨 Пользовательский интерфейс',
    icon: <Palette className="h-5 w-5" />,
    description: 'Дизайн и UX улучшения',
    tasks: []
  },
  {
    id: 'admin',
    name: '🛠️ Администрирование',
    icon: <Settings className="h-5 w-5" />,
    description: 'Управление системой и мониторинг',
    tasks: []
  },
  {
    id: 'perf',
    name: '📈 Производительность и оптимизация',
    icon: <Zap className="h-5 w-5" />,
    description: 'Оптимизация скорости и эффективности',
    tasks: []
  },
  {
    id: 'security',
    name: '🔒 Безопасность',
    icon: <Shield className="h-5 w-5" />,
    description: 'Защита данных и безопасность системы',
    tasks: []
  },
  {
    id: 'testing',
    name: '🧪 Тестирование',
    icon: <TestTube className="h-5 w-5" />,
    description: 'Тестирование и контроль качества',
    tasks: []
  },
  {
    id: 'docs',
    name: '📚 Документация',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Документация и руководства',
    tasks: []
  },
  {
    id: 'devops',
    name: '🚀 Развертывание и DevOps',
    icon: <Rocket className="h-5 w-5" />,
    description: 'CI/CD и развертывание',
    tasks: []
  }
]

export default function ChecklistPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Загрузка задач из API
    const loadTasks = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('No userId found in localStorage');
          return;
        }
        
        const response = await fetch('/api/checklist/tasks', {
          headers: {
            'X-User-ID': userId,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAllTasks(data.tasks);
          
          // Распределение задач по категориям
          categories.forEach(category => {
            category.tasks = data.tasks.filter((task: Task) => task.id.startsWith(category.id));
          });
        } else {
          console.error('Ошибка загрузки задач:', response.statusText);
        }
      } catch (error) {
        console.error('Ошибка загрузки задач:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  const updateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }
      
      const response = await fetch('/api/checklist/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ taskId, status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Обновляем состояние
        setAllTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );

        // Обновляем задачи в категориях
        categories.forEach(category => {
          const taskIndex = category.tasks.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            category.tasks[taskIndex].status = newStatus;
          }
        });
      } else {
        console.error('Ошибка обновления статуса задачи:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка обновления статуса задачи:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(task => task.status === 'completed').length
    return Math.round((completed / tasks.length) * 100)
  }

  const totalProgress = calculateProgress(allTasks)
  const completedTasks = allTasks.filter(task => task.status === 'completed').length
  const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length
  const pendingTasks = allTasks.filter(task => task.status === 'pending').length

  const highPriorityTasks = allTasks.filter(task => task.priority === 'high' && task.status !== 'completed')
  const mediumPriorityTasks = allTasks.filter(task => task.priority === 'medium' && task.status !== 'completed')
  const lowPriorityTasks = allTasks.filter(task => task.priority === 'low' && task.status !== 'completed')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка чек-листа...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Чек-лист разработки ProjectMind</h1>
          <p className="text-muted-foreground mt-2">
            Полный список функций для системы управления проектами с AI-ассистентом
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {totalProgress}% завершено
        </Badge>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общий прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
            <Progress value={totalProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">задач завершено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">задач в процессе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ожидает</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">задач в очереди</p>
          </CardContent>
        </Card>
      </div>

      {/* Приоритеты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Задачи по приоритету
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Высокий</Badge>
                <span className="text-sm text-muted-foreground">{highPriorityTasks.length} задач</span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {highPriorityTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(task.status)}
                      <span className="truncate">{task.content}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Средний</Badge>
                <span className="text-sm text-muted-foreground">{mediumPriorityTasks.length} задач</span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {mediumPriorityTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(task.status)}
                      <span className="truncate">{task.content}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Низкий</Badge>
                <span className="text-sm text-muted-foreground">{lowPriorityTasks.length} задач</span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {lowPriorityTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(task.status)}
                      <span className="truncate">{task.content}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальный чек-лист по категориям */}
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          {categories.slice(0, 12).map(category => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <Progress value={calculateProgress(category.tasks)} className="flex-1" />
                  <span className="text-sm font-medium">{calculateProgress(category.tasks)}%</span>
                  <Badge variant="outline">
                    {category.tasks.filter(t => t.status === 'completed')}/{category.tasks.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-medium">{task.content}</p>
                      </div>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Высокий' : 
                         task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newStatus = task.status === 'completed' ? 'pending' : 
                                          task.status === 'in_progress' ? 'completed' : 'in_progress';
                          updateTaskStatus(task.id, newStatus);
                        }}
                      >
                        {task.status === 'completed' ? 'Завершено' :
                         task.status === 'in_progress' ? 'В работе' : 'Начать'}
                      </Button>
                    </div>
                  ))}
                  {category.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Задачи для этой категории еще не добавлены</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}