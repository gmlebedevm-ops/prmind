'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, CheckCircle, BarChart3, Calendar as CalendarIcon, GanttChart, LogIn, Settings, ListTodo, Clock, Target } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    members: number;
  };
  tasks?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

const statusColors = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  PLANNING: 'Планирование',
  ACTIVE: 'Активный',
  ON_HOLD: 'На паузе',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const calculateProgress = (tasks: Project['tasks']) => {
  if (!tasks || tasks.total === 0) return 0;
  return Math.round((tasks.completed / tasks.total) * 100);
};

const getProgressColor = (progress: number) => {
  if (progress === 0) return 'bg-gray-200';
  if (progress < 30) return 'bg-red-500';
  if (progress < 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Не указана';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      // Используем только user.id из контекста аутентификации
      if (!user?.id) {
        console.error('No user available for fetchProjects');
        return;
      }
      
      const response = await fetch('/api/projects', {
        headers: {
          'X-User-ID': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Показываем загрузку во время проверки аутентификации
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка ProjectMind...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не аутентифицирован, показываем страницу приветствия
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ProjectMind
            </h1>
            <p className="text-2xl text-muted-foreground mb-8">
              Управление проектами с AI-ассистентом
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Интеллектуальное управление задачами</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Визуализация проектов и сроков</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Аналитика и отчетность</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Интеграция с AI-ассистентом</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                <LogIn className="mr-2 h-5 w-5" />
                Войти в систему
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Узнать больше
            </Button>
          </div>
        </div>
        
        {/* Демо-аккаунты */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Демо-доступ</CardTitle>
            <CardDescription>
              Используйте эти учетные данные для тестирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-sm">Администратор</p>
                <p className="text-xs text-muted-foreground">admin@example.com / password123</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-sm">Менеджер</p>
                <p className="text-xs text-muted-foreground">manager@example.com / password123</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium text-sm">Пользователь</p>
                <p className="text-xs text-muted-foreground">user@example.com / password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если пользователь аутентифицирован, показываем дашборд
  return (
    <ProtectedRoute>
      <AppLayout>
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Мои проекты</h2>
                <p className="text-muted-foreground">
                  Управляйте вашими проектами и задачами
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/tasks">
                  <Button variant="outline">
                    <ListTodo className="mr-2 h-4 w-4" />
                    Все задачи
                  </Button>
                </Link>
                <Button onClick={handleCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать проект
                </Button>
              </div>
            </div>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse h-full flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-10">
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2 border-t pt-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">У вас пока нет проектов</h3>
              <p className="text-muted-foreground mb-4">
                Создайте свой первый проект и начните управлять задачами
              </p>
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Создать проект
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => {
                const progress = calculateProgress(project.tasks);
                return (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg leading-tight pr-2">{project.title}</CardTitle>
                        <Badge className={`${statusColors[project.status]} shrink-0 text-xs`}>
                          {statusLabels[project.status]}
                        </Badge>
                      </div>
                      <div className="h-10"> {/* Фиксированная высота для описания */}
                        {project.description && (
                          <CardDescription className="text-sm line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                      {/* Прогресс проекта */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Прогресс</span>
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Статистика задач */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>Всего: {project.tasks?.total || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Завершено: {project.tasks?.completed || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <Clock className="h-3 w-3" />
                          <span>В работе: {project.tasks?.inProgress || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-600">
                          <ListTodo className="h-3 w-3" />
                          <span>В ожидании: {project.tasks?.pending || 0}</span>
                        </div>
                      </div>

                      {/* Даты и участники */}
                      <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Начало:</span>
                          </div>
                          <span>{formatDate(project.startDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Завершение:</span>
                          </div>
                          <span>{formatDate(project.endDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Участники:</span>
                          </div>
                          <span>{project._count.members}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        {/* AI-ассистент */}
        <AIAssistant />
      </AppLayout>
    </ProtectedRoute>
  );
}