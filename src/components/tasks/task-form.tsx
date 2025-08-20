'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Plus, 
  X, 
  Calendar,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
  parentTaskId?: string;
  tags?: Tag[];
}

const taskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Проект обязателен'),
  assigneeId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  parentTaskId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  projects: Project[];
  users: User[];
  tags: Tag[];
  parentTasks?: Task[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  loading?: boolean;
  defaultProjectId?: string;
  defaultStatus?: Task['status'];
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  projects,
  users,
  tags,
  parentTasks,
  onSubmit,
  loading = false,
  defaultProjectId,
  defaultStatus = 'TODO'
}: TaskFormProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: defaultStatus,
      priority: 'MEDIUM',
    },
  });

  const watchedProjectId = watch('projectId');
  const watchedStatus = watch('status');
  const watchedPriority = watch('priority');

  useEffect(() => {
    if (open) {
      if (task) {
        // Редактирование существующей задачи
        reset({
          title: task.title,
          description: task.description || '',
          projectId: task.projectId,
          assigneeId: task.assigneeId || 'unassigned',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
          startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
          parentTaskId: task.parentTaskId || 'none',
        });
        setSelectedTags(task.tags || []);
      } else {
        // Создание новой задачи
        reset({
          status: defaultStatus,
          priority: 'MEDIUM',
          projectId: defaultProjectId || '',
        });
        setSelectedTags([]);
      }
      setError(null);
    }
  }, [open, task, reset, defaultStatus, defaultProjectId]);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setError(null);
      
      // Преобразуем специальные значения в null для отправки на сервер
      const processedData = {
        ...data,
        assigneeId: data.assigneeId === 'unassigned' ? null : data.assigneeId,
        parentTaskId: data.parentTaskId === 'none' ? null : data.parentTaskId,
      };
      
      await onSubmit(processedData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения задачи');
    }
  };

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const filteredParentTasks = parentTasks?.filter(
    pt => pt.projectId === watchedProjectId && pt.id !== task?.id
  ) || [];

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Редактировать задачу' : 'Создать задачу'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Измените информацию о задаче' : 'Заполните информацию о новой задаче'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
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
                value={watchedProjectId} 
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
          </div>

          {/* Статус и приоритет */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select 
                value={watchedStatus} 
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">К выполнению</SelectItem>
                  <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                  <SelectItem value="REVIEW">На проверке</SelectItem>
                  <SelectItem value="DONE">Выполнено</SelectItem>
                  <SelectItem value="CANCELLED">Отменено</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select 
                value={watchedPriority} 
                onValueChange={(value) => setValue('priority', value as any)}
              >
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
          </div>

          {/* Исполнитель и родительская задача */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Исполнитель</Label>
              <Select 
                value={watch('assigneeId')} 
                onValueChange={(value) => setValue('assigneeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Без исполнителя</SelectItem>
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

            {filteredParentTasks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentTaskId">Родительская задача</Label>
                <Select 
                  value={watch('parentTaskId')} 
                  onValueChange={(value) => setValue('parentTaskId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите родительскую задачу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без родительской задачи</SelectItem>
                    {filteredParentTasks.map((parentTask) => (
                      <SelectItem key={parentTask.id} value={parentTask.id}>
                        {parentTask.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentTaskId && (
                  <p className="text-sm text-red-500">{errors.parentTaskId.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Даты */}
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

          {/* Теги */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      style={isSelected && tag.color ? { backgroundColor: tag.color } : {}}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Кнопки */}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                task ? 'Сохранить изменения' : 'Создать задачу'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}