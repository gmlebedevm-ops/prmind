'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
}

const createTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Проект обязателен'),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      projectId: projectId || '',
    },
  });

  const selectedProjectId = watch('projectId');

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (projectId) {
      setValue('projectId', projectId);
    }
  }, [projectId, setValue]);

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
    }
  };

  const fetchUsers = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/users', {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: CreateTaskFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId || '',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания задачи');
      }

      router.push(`/tasks/${result.task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания задачи');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <div className="flex items-center gap-4">
              <Link href={projectId ? `/projects/${projectId}` : '/'}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Создание задачи</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Новая задача</CardTitle>
                <CardDescription>
                  Заполните информацию о задаче
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название задачи *</Label>
                    <Input
                      id="title"
                      placeholder="Введите название задачи"
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      placeholder="Введите описание задачи"
                      rows={4}
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectId">Проект *</Label>
                    <Select 
                      value={selectedProjectId} 
                      onValueChange={(value) => setValue('projectId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите проект" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.projectId && (
                      <p className="text-sm text-red-500">{errors.projectId.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Приоритет</Label>
                      <Select onValueChange={(value) => setValue('priority', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите приоритет" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Низкий</SelectItem>
                          <SelectItem value="MEDIUM">Средний</SelectItem>
                          <SelectItem value="HIGH">Высокий</SelectItem>
                          <SelectItem value="URGENT">Срочный</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-sm text-red-500">{errors.priority.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assigneeId">Исполнитель</Label>
                      <Select onValueChange={(value) => setValue('assigneeId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите исполнителя" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Без исполнителя</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.assigneeId && (
                        <p className="text-sm text-red-500">{errors.assigneeId.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Дата начала</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-500">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Срок выполнения</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        {...register('dueDate')}
                      />
                      {errors.dueDate && (
                        <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        'Создать задачу'
                      )}
                    </Button>
                    <Link href={projectId ? `/projects/${projectId}` : '/'}>
                      <Button type="button" variant="outline">
                        Отмена
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}