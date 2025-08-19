'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { TaskComments } from '@/components/tasks/task-comments';
import { ArrowLeft, Calendar, User, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    title: string;
  };
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
  creator: {
    id: string;
    name?: string;
    email: string;
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name?: string;
      email: string;
    };
  }>;
  timeLogs: Array<{
    id: string;
    description?: string;
    hours: number;
    date: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
    assignee?: {
      id: string;
      name?: string;
      email: string;
    };
  }>;
}

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
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

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (taskId) {
      setCurrentUserId(localStorage.getItem('userId') || '');
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Задача не найдена');
        } else {
          setError('Ошибка загрузки задачи');
        }
        return;
      }

      const data = await response.json();
      setTask(data.task);
    } catch (err) {
      setError('Ошибка загрузки задачи');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !task) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{error || 'Задача не найдена'}</h1>
            <Link href="/">
              <Button>Вернуться на главную</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/projects/${task.project.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад к проекту
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">{task.title}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge className={statusColors[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                    <Badge className={priorityColors[task.priority]}>
                      {priorityLabels[task.priority]}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>Проект:</span>
                      <Link href={`/projects/${task.project.id}`} className="hover:underline">
                        {task.project.title}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Редактировать
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="details">Детали</TabsTrigger>
                  <TabsTrigger value="comments">
                    Комментарии ({task.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="time">
                    Время ({task.timeLogs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Описание</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {task.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {task.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Описание отсутствует</p>
                      )}
                    </CardContent>
                  </Card>

                  {task.subtasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Подзадачи</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  subtask.status === 'DONE' ? 'bg-green-500' :
                                  subtask.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                  'bg-gray-300'
                                }`}></div>
                                <span className="font-medium">{subtask.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${statusColors[subtask.status]}`}>
                                  {statusLabels[subtask.status]}
                                </Badge>
                                {subtask.assignee && (
                                  <span className="text-xs text-muted-foreground">
                                    {subtask.assignee.name || subtask.assignee.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                  <TaskComments taskId={taskId} currentUserId={currentUserId} />
                </TabsContent>

                <TabsContent value="time" className="space-y-4">
                  {task.timeLogs.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Записи о времени отсутствуют</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Общее время</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {task.timeLogs.reduce((total, log) => total + log.hours, 0)} часов
                          </div>
                        </CardContent>
                      </Card>
                      
                      {task.timeLogs.map((timeLog) => (
                        <Card key={timeLog.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {timeLog.user.name || timeLog.user.email}
                                </span>
                                <Badge variant="outline">
                                  {timeLog.hours}ч
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(timeLog.date).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {timeLog.description && (
                              <p className="text-sm text-muted-foreground">
                                {timeLog.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Создатель:</span>
                      <span>{task.creator.name || task.creator.email}</span>
                    </div>
                    
                    {task.assignee && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Исполнитель:</span>
                        <span>{task.assignee.name || task.assignee.email}</span>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Срок:</span>
                        <span>{new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}

                    {task.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Начало:</span>
                        <span>{new Date(task.startDate).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Создана:</span>
                      <span>{new Date(task.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    Добавить комментарий
                  </Button>
                  <Button className="w-full" variant="outline">
                    Записать время
                  </Button>
                  <Button className="w-full" variant="outline">
                    Создать подзадачу
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* AI Assistant */}
        <AIAssistant projectId={task.project.id} taskId={taskId} />
      </div>
    </ProtectedRoute>
  );
}