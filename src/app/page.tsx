'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, CheckCircle, BarChart3, Calendar as CalendarIcon, GanttChart, LogIn, Settings } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AIAssistant } from '@/components/ai/ai-assistant';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    members: number;
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
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/projects', {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
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
                <p className="text-xs text-muted-foreground">admin@projectmind.local / admin123</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-sm">Менеджер</p>
                <p className="text-xs text-muted-foreground">manager@projectmind.local / password123</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium text-sm">Пользователь</p>
                <p className="text-xs text-muted-foreground">user@projectmind.local / password123</p>
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">ProjectMind</h1>
              <p className="text-sm text-muted-foreground">
                Добро пожаловать, {user.name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Аналитика
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Календарь
                </Button>
              </Link>
              <Link href="/gantt">
                <Button variant="outline">
                  <GanttChart className="mr-2 h-4 w-4" />
                  Гант-диаграмма
                </Button>
              </Link>
              <Link href="/ai-settings">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки AI
                </Button>
              </Link>
              <Button onClick={handleCreateProject}>
                <Plus className="mr-2 h-4 w-4" />
                Создать проект
              </Button>
              <Button variant="outline" onClick={logout}>
                Выйти
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Мои проекты</h2>
            <p className="text-muted-foreground">
              Управляйте вашими проектами и задачами
            </p>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{project._count.tasks} задач</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{project._count.members} участников</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* AI-ассистент */}
      <AIAssistant />
    </ProtectedRoute>
  );
}