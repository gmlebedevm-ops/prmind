'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { TaskList } from '@/components/tasks/task-list';
import { TaskKanban } from '@/components/tasks/task-kanban';
import { TaskStats } from '@/components/tasks/task-stats';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskFilters, TaskFiltersState } from '@/components/tasks/task-filters';
import { useAuth } from '@/hooks/use-auth';
import { 
  Plus, 
  List, 
  Grid3X3, 
  BarChart3, 
  Filter,
  ArrowLeft,
  Loader2
} from 'lucide-react';
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
  comments: Array<any>;
  subtasks: Array<any>;
  tags: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  _count?: {
    comments: number;
    subtasks: number;
  };
}

interface Project {
  id: string;
  title: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

type ViewMode = 'list' | 'kanban' | 'stats';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { user, loading: authLoading } = useAuth();
  
  console.log('TasksPage render:', { 
    user: user?.id, 
    authLoading, 
    projectId,
    timestamp: new Date().toISOString()
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilters, setActiveFilters] = useState<TaskFiltersState>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    tags: [],
    dueDateFrom: '',
    dueDateTo: '',
    hasOverdue: false,
    hasDueSoon: false,
    hasNoAssignee: false,
    hasNoDueDate: false,
  });

  // Сначала определяем все функции с useCallback
  const fetchTasks = useCallback(async () => {
    // Используем только user.id из контекста аутентификации
    if (!user?.id) {
      console.log('No user available for fetchTasks');
      return;
    }
    
    console.log('Fetching tasks...', { userId: user.id, projectId });
    try {
      const url = new URL('/api/tasks', window.location.origin);
      if (projectId) {
        url.searchParams.append('projectId', projectId);
      }
      
      const headers = {
        'X-User-ID': user.id,
      };
      
      console.log('Making request to:', url.toString());
      console.log('With headers:', headers);
      
      const response = await fetch(url.toString(), {
        headers,
      });

      console.log('Tasks response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks data received:', data.tasks?.length || 0);
        setTasks(data.tasks);
        setFilteredTasks(data.tasks);
      } else {
        console.error('Tasks response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.id]); // Добавляем user?.id в зависимости

  const fetchProjects = useCallback(async () => {
    // Используем только user.id из контекста аутентификации
    if (!user?.id) {
      console.log('No user available for fetchProjects');
      return;
    }
    
    console.log('Fetching projects...', { userId: user.id });
    try {
      const headers = {
        'X-User-ID': user.id,
      };
      
      console.log('Making request to: /api/projects');
      console.log('With headers:', headers);
      
      const response = await fetch('/api/projects', {
        headers,
      });

      console.log('Projects response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Projects data received:', data.projects?.length || 0);
        setProjects(data.projects);
      } else {
        console.error('Projects response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  }, [user?.id]); // Добавляем user?.id в зависимости

  const fetchUsers = useCallback(async () => {
    // Используем только user.id из контекста аутентификации
    if (!user?.id) {
      console.log('No user available for fetchUsers');
      return;
    }
    
    console.log('Fetching users...', { userId: user.id });
    try {
      const headers = {
        'X-User-ID': user.id,
      };
      
      console.log('Making request to: /api/users');
      console.log('With headers:', headers);
      
      const response = await fetch('/api/users', {
        headers,
      });

      console.log('Users response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data.users?.length || 0);
        setUsers(data.users);
      } else {
        console.error('Users response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  }, [user?.id]); // Добавляем user?.id в зависимости

  const fetchTags = useCallback(async () => {
    // Используем только user.id из контекста аутентификации
    if (!user?.id) {
      console.log('No user available for fetchTags');
      return;
    }
    
    console.log('Fetching tags...', { userId: user.id });
    try {
      const headers = {
        'X-User-ID': user.id,
      };
      
      console.log('Making request to: /api/tags');
      console.log('With headers:', headers);
      
      const response = await fetch('/api/tags', {
        headers,
      });

      console.log('Tags response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Tags data received:', data.tags?.length || 0);
        setTags(data.tags);
      } else {
        console.error('Tags response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки тегов:', error);
    }
  }, [user?.id]); // Добавляем user?.id в зависимости

  // Теперь определяем useEffect после всех функций
  useEffect(() => {
    console.log('TasksPage useEffect triggered', { 
      user: user?.id, 
      authLoading, 
      projectId,
      timestamp: new Date().toISOString()
    });
    
    // Не делаем запросы, если аутентификация ещё загружается
    if (authLoading) {
      console.log('Auth still loading, skipping fetch');
      return;
    }
    
    // Используем только user.id из контекста аутентификации
    if (user?.id) {
      console.log('User available, fetching data...');
      // Небольшая задержка чтобы убедиться, что состояние аутентификации установлено
      const timer = setTimeout(() => {
        fetchTasks();
        fetchProjects();
        fetchUsers();
        fetchTags();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('No user available, skipping fetch');
    }
    
  }, [projectId, user, authLoading, fetchTasks, fetchProjects, fetchUsers, fetchTags]);

  // Отдельный эффект для обработки изменений аутентификации
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Auth state changed, user available:', user.id);
      // Перезагружаем данные при изменении состояния аутентификации
      const timer = setTimeout(() => {
        fetchTasks();
        fetchProjects();
        fetchUsers();
        fetchTags();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, fetchTasks, fetchProjects, fetchUsers, fetchTags]);

  const applyFilters = (filters: TaskFiltersState) => {
    setActiveFilters(filters);
    
    let filtered = [...tasks];

    // Поиск
    if (filters.search) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Статус
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    // Приоритет
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }

    // Исполнитель
    if (filters.assignee.length > 0) {
      filtered = filtered.filter(task => 
        task.assignee && filters.assignee.includes(task.assignee.email)
      );
    }

    // Проект
    if (filters.project.length > 0) {
      filtered = filtered.filter(task => 
        filters.project.includes(task.project.title)
      );
    }

    // Теги
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags?.some(tag => filters.tags.includes(tag.name))
      );
    }

    // Даты
    if (filters.dueDateFrom) {
      filtered = filtered.filter(task =>
        task.dueDate && new Date(task.dueDate) >= new Date(filters.dueDateFrom)
      );
    }

    if (filters.dueDateTo) {
      filtered = filtered.filter(task =>
        task.dueDate && new Date(task.dueDate) <= new Date(filters.dueDateTo)
      );
    }

    // Специальные фильтры
    if (filters.hasOverdue) {
      const now = new Date();
      filtered = filtered.filter(task =>
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE'
      );
    }

    if (filters.hasDueSoon) {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(task =>
        task.dueDate && new Date(task.dueDate) <= threeDaysFromNow && task.status !== 'DONE'
      );
    }

    if (filters.hasNoAssignee) {
      filtered = filtered.filter(task => !task.assigneeId);
    }

    if (filters.hasNoDueDate) {
      filtered = filtered.filter(task => !task.dueDate);
    }

    setFilteredTasks(filtered);
  };

  const clearFilters = () => {
    setActiveFilters({
      search: '',
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tags: [],
      dueDateFrom: '',
      dueDateTo: '',
      hasOverdue: false,
      hasDueSoon: false,
      hasNoAssignee: false,
      hasNoDueDate: false,
    });
    setFilteredTasks(tasks);
  };

  const handleCreateTask = async (taskData: any) => {
    if (!user?.id) {
      console.error('No user available for handleCreateTask');
      throw new Error('Пользователь не аутентифицирован');
    }
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
      };
      
      console.log('Creating task with headers:', headers);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData),
      });

      console.log('Create task response status:', response.status);
      if (response.ok) {
        await fetchTasks();
      } else {
        const errorText = await response.text();
        console.error('Create task error response:', errorText);
        throw new Error('Ошибка создания задачи');
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      throw error;
    }
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleTaskEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowTaskForm(true);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!user?.id) {
      console.error('No user available for handleTaskDelete');
      return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }

    try {
      const headers = {
        'X-User-ID': user.id,
      };
      
      console.log('Deleting task with headers:', headers);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      console.log('Delete task response status:', response.status);
      if (response.ok) {
        await fetchTasks();
      } else {
        const errorText = await response.text();
        console.error('Delete task error response:', errorText);
        throw new Error('Ошибка удаления задачи');
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
    if (!user?.id) {
      console.error('No user available for handleTaskStatusChange');
      return;
    }
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
      };
      
      console.log('Updating task status with headers:', headers);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });

      console.log('Update task status response status:', response.status);
      if (response.ok) {
        await fetchTasks();
      } else {
        const errorText = await response.text();
        console.error('Update task status error response:', errorText);
        throw new Error('Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const getAvailableParentTasks = () => {
    return tasks.filter(task => task.projectId === projectId);
  };

  // Показываем загрузчик, если аутентификация еще загружается
  if (authLoading) {
    console.log('Showing auth loader:', { authLoading, user: user?.id });
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

  // Проверяем, есть ли userId
  if (!user?.id) {
    console.log('No userId available, showing auth loader');
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

  if (loading) {
    console.log('Showing data loader');
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
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {projectId && (
                <Link href={`/projects/${projectId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад к проекту
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-3xl font-bold">Управление задачами</h1>
                <p className="text-muted-foreground">
                  {projectId ? 'Задачи проекта' : 'Все задачи'}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowTaskForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
          </div>

          {/* Фильтры */}
          <TaskFilters
            tasks={tasks}
            onFiltersChange={applyFilters}
            onClearFilters={clearFilters}
          />

          {/* Основной контент */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Список
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Канбан
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Статистика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <TaskList
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
                projectId={projectId || undefined}
              />
            </TabsContent>

            <TabsContent value="kanban" className="mt-6">
              <TaskKanban
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
                onCreateTask={(status) => {
                  if (status) {
                    setShowTaskForm(true);
                  }
                }}
                projectId={projectId || undefined}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <TaskStats
                tasks={filteredTasks}
                title="Статистика по отфильтрованным задачам"
                showCharts={true}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Форма создания/редактирования задачи */}
        <TaskForm
          open={showTaskForm}
          onOpenChange={setShowTaskForm}
          task={editingTask}
          projects={projects}
          users={users}
          tags={tags}
          parentTasks={getAvailableParentTasks()}
          onSubmit={handleCreateTask}
          defaultProjectId={projectId || undefined}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}