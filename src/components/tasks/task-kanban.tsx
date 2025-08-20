'use client';

import { useState } from 'react';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  MoreHorizontal, 
  Settings,
  Filter,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Task } from './task-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  onCreateTask?: (status?: Task['status']) => void;
  loading?: boolean;
  projectId?: string;
  compact?: boolean;
}

type Column = {
  id: Task['status'];
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
};

const columns: Column[] = [
  {
    id: 'TODO',
    title: 'К выполнению',
    description: 'Задачи, которые нужно начать',
    color: 'bg-gray-100',
    icon: '📋'
  },
  {
    id: 'IN_PROGRESS',
    title: 'В работе',
    description: 'Активные задачи',
    color: 'bg-blue-100',
    icon: '🔄'
  },
  {
    id: 'REVIEW',
    title: 'На проверке',
    description: 'Задачи на ревью',
    color: 'bg-yellow-100',
    icon: '👀'
  },
  {
    id: 'DONE',
    title: 'Выполнено',
    description: 'Завершенные задачи',
    color: 'bg-green-100',
    icon: '✅'
  },
  {
    id: 'CANCELLED',
    title: 'Отменено',
    description: 'Отмененные задачи',
    color: 'bg-red-100',
    icon: '❌'
  }
];

export function TaskKanban({
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  loading = false,
  projectId,
  compact = false
}: TaskKanbanProps) {
  const [showCancelled, setShowCancelled] = useState(false);

  // Группируем задачи по статусам
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<Task['status'], Task[]>);

  // Фильтруем колонки для отображения
  const visibleColumns = showCancelled 
    ? columns 
    : columns.filter(col => col.id !== 'CANCELLED');

  const handleCreateTask = (status?: Task['status']) => {
    if (onCreateTask) {
      onCreateTask(status);
    }
  };

  const getTaskCount = (status: Task['status']) => {
    return tasksByStatus[status]?.length || 0;
  };

  const getPriorityCount = (status: Task['status'], priority: Task['priority']) => {
    return tasksByStatus[status]?.filter(task => task.priority === priority).length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Канбан-доска</h2>
          <p className="text-muted-foreground">
            {tasks.length} задач всего
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelled(!showCancelled)}
          >
            {showCancelled ? 'Скрыть отмененные' : 'Показать отмененные'}
          </Button>
          {onCreateTask && (
            <Button onClick={() => handleCreateTask()}>
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
          )}
        </div>
      </div>

      {/* Канбан-доска */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          const taskCount = columnTasks.length;
          
          // Считаем статистику по приоритетам
          const urgentCount = getPriorityCount(column.id, 'URGENT');
          const highCount = getPriorityCount(column.id, 'HIGH');
          const mediumCount = getPriorityCount(column.id, 'MEDIUM');
          const lowCount = getPriorityCount(column.id, 'LOW');

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 ${compact ? 'w-72' : ''}`}
            >
              {/* Заголовок колонки */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{column.icon}</span>
                      <CardTitle className="text-lg">{column.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {taskCount}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {column.description}
                  </p>
                  
                  {/* Статистика по приоритетам */}
                  {taskCount > 0 && (
                    <div className="flex gap-1 mt-2">
                      {urgentCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {urgentCount}
                        </Badge>
                      )}
                      {highCount > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          {highCount}
                        </Badge>
                      )}
                      {mediumCount > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {mediumCount}
                        </Badge>
                      )}
                      {lowCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {lowCount}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Задачи в колонке */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : columnTasks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-8">
                      <div className="text-muted-foreground text-sm">
                        Нет задач
                      </div>
                      {onCreateTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleCreateTask(column.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Добавить задачу
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={onTaskClick}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      onStatusChange={onTaskStatusChange}
                      compact={compact}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Навигация по колонкам для мобильных устройств */}
      <div className="md:hidden flex items-center justify-between">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Предыдущая
        </Button>
        <span className="text-sm text-muted-foreground">
          Колонка 1 из {visibleColumns.length}
        </span>
        <Button variant="outline" size="sm">
          Следующая
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Общая статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {columns.map((column) => {
              const count = getTaskCount(column.id);
              const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
              
              return (
                <div key={column.id} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{column.title}</div>
                  <div className="text-xs text-muted-foreground">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}