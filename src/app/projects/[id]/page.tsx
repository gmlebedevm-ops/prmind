'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { ProjectAIAssistant } from '@/components/ai/project-ai-assistant';
import { ArrowLeft, Plus, Users, Calendar, CheckCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    role: 'OWNER' | 'MANAGER' | 'MEMBER';
    user: {
      id: string;
      name?: string;
      email: string;
      role: 'ADMIN' | 'MANAGER' | 'USER';
    };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignee?: {
      id: string;
      name?: string;
      email: string;
    };
    dueDate?: string;
  }>;
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

const taskStatusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const taskStatusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Выполнено',
  CANCELLED: 'Отменено',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

const memberRoleLabels = {
  OWNER: 'Владелец',
  MANAGER: 'Менеджер',
  MEMBER: 'Участник',
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Ждем, пока проверка аутентификации завершится
    if (authLoading) {
      return;
    }
    
    if (!user) {
      setError('Пользователь не аутентифицирован');
      setLoading(false);
      return;
    }
    
    if (projectId) {
      fetchProject();
    } else {
      setError('ID проекта не указан');
      setLoading(false);
    }
  }, [projectId, authLoading, user]);

  const fetchProject = async () => {
    try {
      // Используем user.id вместо localStorage для большей надежности
      const userId = user?.id || localStorage.getItem('userId');
      console.log('Fetching project - userId from auth/user:', user?.id);
      console.log('Fetching project - userId from localStorage:', localStorage.getItem('userId'));
      console.log('Fetching project - final userId:', userId);
      
      if (!userId) {
        setError('Пользователь не аутентифицирован');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/projects/${projectId}?userId=${userId}`, {
        headers: {
          'X-User-ID': userId,
        },
      });
      
      console.log('Project API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Проект не найден');
        } else if (response.status === 401) {
          setError('Ошибка аутентификации');
        } else {
          setError('Ошибка загрузки проекта');
        }
        return;
      }

      const data = await response.json();
      console.log('Project data received:', data);
      setProject(data.project);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    router.push(`/tasks/create?projectId=${projectId}`);
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  if (loading || authLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{error || 'Проект не найден'}</h1>
            <Link href="/">
              <Button>Вернуться на главную</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const tasksByStatus = project.tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof project.tasks>);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">{project.title}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge className={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>{project.tasks.length} задач</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.members.length} участников</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задачу
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="members">Участники</TabsTrigger>
              <TabsTrigger value="ai">AI-ассистент</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Задачи проекта</h3>
                  <p className="text-sm text-muted-foreground">
                    Управление задачами в различных режимах отображения
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/tasks?projectId=${projectId}`}>
                    <Button variant="outline">
                      Полное управление
                    </Button>
                  </Link>
                  <Button onClick={handleCreateTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать задачу
                  </Button>
                </div>
              </div>

              {/* Быстрая статистика */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(taskStatusLabels).map(([status, label]) => {
                  const count = project.tasks.filter(t => t.status === status).length;
                  const percentage = project.tasks.length > 0 ? Math.round((count / project.tasks.length) * 100) : 0;
                  
                  return (
                    <Card key={status} className="text-center">
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold mb-1">{count}</div>
                        <div className="text-xs text-muted-foreground mb-2">{label}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${taskStatusColors[status as keyof typeof taskStatusColors].split(' ')[0]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Канбан-доска для задач проекта */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(tasksByStatus).map(([status, tasks]) => (
                  <div key={status} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        {taskStatusLabels[status as keyof typeof taskStatusLabels]}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {tasks.map((task) => (
                        <Card 
                          key={task.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm leading-tight">{task.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between gap-2">
                              <Badge 
                                className={`text-xs ${priorityColors[task.priority]}`}
                              >
                                {priorityLabels[task.priority]}
                              </Badge>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
                                </div>
                              )}
                            </div>
                            {task.assignee && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Исполнитель: {task.assignee.name || task.assignee.email}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          Нет задач
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>О проекте</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.description ? (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Описание отсутствует</p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Статус:</span>
                        <Badge className={statusColors[project.status]}>
                          {statusLabels[project.status]}
                        </Badge>
                      </div>
                      {project.startDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Дата начала:</span>
                          <span>{new Date(project.startDate).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Дата окончания:</span>
                          <span>{new Date(project.endDate).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Создан:</span>
                        <span>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Статистика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Всего задач:</span>
                        <span className="font-semibold">{project.tasks.length}</span>
                      </div>
                      
                      {Object.entries(taskStatusLabels).map(([status, label]) => {
                        const count = project.tasks.filter(t => t.status === status).length;
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{label}:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{count}</span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${taskStatusColors[status as keyof typeof taskStatusColors].split(' ')[0]}`}
                                  style={{ width: `${(count / project.tasks.length) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Участники проекта</CardTitle>
                  <CardDescription>
                    Люди, работающие над этим проектом
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {memberRoleLabels[member.role]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {member.user.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <ProjectAIAssistant projectId={projectId} projectName={project.title} />
            </TabsContent>
          </Tabs>
        </main>

        {/* AI Assistant */}
        <AIAssistant projectId={projectId} />
      </div>
    </ProtectedRoute>
  );
}