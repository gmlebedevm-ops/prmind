'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  User, 
  MoreHorizontal, 
  MessageSquare,
  CheckCircle,
  Circle,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  _count?: {
    comments: number;
    subtasks: number;
  };
}

interface TaskCardProps {
  task: Task;
  onClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
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

const statusIcons = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  REVIEW: AlertTriangle,
  DONE: CheckCircle,
  CANCELLED: Circle,
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

const getDueDateStatus = (dueDate?: string) => {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'overdue', color: 'text-red-600' };
  if (diffDays <= 3) return { status: 'urgent', color: 'text-orange-600' };
  if (diffDays <= 7) return { status: 'warning', color: 'text-yellow-600' };
  return { status: 'normal', color: 'text-green-600' };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  return format(new Date(dateString), 'd MMM', { locale: ru });
};

export function TaskCard({ 
  task, 
  onClick, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  showActions = true,
  compact = false 
}: TaskCardProps) {
  const dueDateStatus = getDueDateStatus(task.dueDate);
  const StatusIcon = statusIcons[task.status];
  const commentCount = task._count?.comments || task.comments.length;
  const subtaskCount = task._count?.subtasks || task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(st => st.status === 'DONE').length;

  const handleClick = () => {
    if (onClick) {
      onClick(task.id);
    }
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
        compact ? 'p-3' : ''
      } ${task.status === 'DONE' ? 'opacity-75' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-sm leading-tight ${compact ? 'text-base' : ''}`}>
              {task.title}
            </CardTitle>
            {!compact && task.description && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit?.(task.id)}>
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('TODO')}
                  disabled={task.status === 'TODO'}
                >
                  В работу
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={task.status === 'IN_PROGRESS'}
                >
                  В процессе
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('REVIEW')}
                  disabled={task.status === 'REVIEW'}
                >
                  На проверку
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('DONE')}
                  disabled={task.status === 'DONE'}
                >
                  Завершить
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(task.id)}
                  className="text-red-600"
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            className={`text-xs ${statusColors[task.status]}`}
            variant="secondary"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabels[task.status]}
          </Badge>
          <Badge 
            className={`text-xs ${priorityColors[task.priority]}`}
            variant="outline"
          >
            {priorityLabels[task.priority]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : 'pt-0'}>
        {/* Информация о проекте и исполнителе */}
        {!compact && (
          <div className="space-y-2 mb-3">
            <div className="text-xs text-muted-foreground">
              Проект: {task.project.title}
            </div>
            
            {task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {(task.assignee.name || task.assignee.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.assignee.name || task.assignee.email}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Даты */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${dueDateStatus?.color}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          
          {task.startDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(task.startDate)}</span>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount}</span>
            </div>
          )}
          
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>{completedSubtasks}/{subtaskCount}</span>
            </div>
          )}
          
          {task.assignee && compact && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-20">
                {task.assignee.name || task.assignee.email}
              </span>
            </div>
          )}
        </div>

        {/* Прогресс подзадач */}
        {subtaskCount > 0 && !compact && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Прогресс подзадач</span>
              <span>{Math.round((completedSubtasks / subtaskCount) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / subtaskCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}