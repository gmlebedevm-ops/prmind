'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/hooks/use-auth';
import { 
  Plus, 
  Search, 
  Users, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  Target, 
  ListTodo,
  Filter,
  ArrowLeft,
  Loader2
} from 'lucide-react';
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

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'X-User-ID': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        setFilteredProjects(data.projects);
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Поиск по названию и описанию
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const getStatusCounts = () => {
    const counts = {
      all: projects.length,
      PLANNING: 0,
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    projects.forEach(project => {
      counts[project.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // Показываем загрузку во время проверки аутентификации
  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Заголовок и действия */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Все проекты</h1>
                <p className="text-muted-foreground">
                  Управляйте всеми вашими проектами
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

            {/* Поиск и фильтры */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск проектов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Все ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === 'PLANNING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('PLANNING')}
                >
                  Планирование ({statusCounts.PLANNING})
                </Button>
                <Button
                  variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('ACTIVE')}
                >
                  Активные ({statusCounts.ACTIVE})
                </Button>
                <Button
                  variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('COMPLETED')}
                >
                  Завершенные ({statusCounts.COMPLETED})
                </Button>
              </div>
            </div>
          </div>

          {/* Список проектов */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Проекты не найдены' : 'У вас пока нет проектов'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска или фильтры'
                  : 'Создайте свой первый проект и начните управлять задачами'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать проект
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
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
                      <div className="h-10">
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
                            <CalendarIcon className="h-3 w-3" />
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
      </AppLayout>
    </ProtectedRoute>
  );
}