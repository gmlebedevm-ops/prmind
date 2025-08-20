'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Circle,
  User,
  Calendar,
  Edit,
  Trash2,
  Copy,
  Archive,
  Flag,
  MessageSquare,
  Plus
} from 'lucide-react';
import { Task } from './task-card';

interface TaskActionsProps {
  task: Task;
  onStatusChange: (status: Task['status']) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onAssigneeChange: (assigneeId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onAddComment?: () => void;
  onAddSubtask?: () => void;
  onLogTime?: () => void;
  availableUsers: Array<{ id: string; name?: string; email: string }>;
  compact?: boolean;
}

const statusOptions = [
  { value: 'TODO', label: 'К выполнению', icon: Circle, color: 'text-gray-600' },
  { value: 'IN_PROGRESS', label: 'В работе', icon: Clock, color: 'text-blue-600' },
  { value: 'REVIEW', label: 'На проверке', icon: AlertTriangle, color: 'text-yellow-600' },
  { value: 'DONE', label: 'Выполнено', icon: CheckCircle, color: 'text-green-600' },
  { value: 'CANCELLED', label: 'Отменено', icon: Circle, color: 'text-red-600' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Низкий', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Средний', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Высокий', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Срочный', color: 'bg-red-100 text-red-800' },
];

export function TaskActions({
  task,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onEdit,
  onDelete,
  onDuplicate,
  onAddComment,
  onAddSubtask,
  onLogTime,
  availableUsers,
  compact = false
}: TaskActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: Task['status']) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  const handlePriorityChange = (priority: Task['priority']) => {
    onPriorityChange(priority);
    setIsOpen(false);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    onAssigneeChange(assigneeId);
    setIsOpen(false);
  };

  const getStatusIcon = (status: Task['status']) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.icon : Circle;
  };

  const StatusIcon = getStatusIcon(task.status);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={compact ? "sm" : "default"}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Изменить статус */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            Изменить статус
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusChange(option.value as Task['status'])}
                  disabled={task.status === option.value}
                  className="flex items-center gap-2"
                >
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span>{option.label}</span>
                  {task.status === option.value && <CheckCircle className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Изменить приоритет */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Изменить приоритет
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {priorityOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handlePriorityChange(option.value as Task['priority'])}
                disabled={task.priority === option.value}
                className="flex items-center gap-2"
              >
                <Badge className={`text-xs ${option.color}`}>
                  {option.label}
                </Badge>
                {task.priority === option.value && <CheckCircle className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Назначить исполнителя */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Назначить исполнителя
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleAssigneeChange('')}
              disabled={!task.assigneeId}
            >
              Убрать исполнителя
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {availableUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleAssigneeChange(user.id)}
                disabled={task.assigneeId === user.id}
                className="flex items-center gap-2"
              >
                <span>{user.name || user.email}</span>
                {task.assigneeId === user.id && <CheckCircle className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Действия с задачей */}
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </DropdownMenuItem>

        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Дублировать
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Дополнительные действия */}
        {onAddComment && (
          <DropdownMenuItem onClick={onAddComment}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Добавить комментарий
          </DropdownMenuItem>
        )}

        {onAddSubtask && (
          <DropdownMenuItem onClick={onAddSubtask}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить подзадачу
          </DropdownMenuItem>
        )}

        {onLogTime && (
          <DropdownMenuItem onClick={onLogTime}>
            <Clock className="mr-2 h-4 w-4" />
            Записать время
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Опасные действия */}
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить задачу
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Компонент для быстрого изменения статуса
interface QuickStatusActionsProps {
  task: Task;
  onStatusChange: (status: Task['status']) => void;
  size?: 'sm' | 'md';
}

export function QuickStatusActions({ 
  task, 
  onStatusChange, 
  size = 'md' 
}: QuickStatusActionsProps) {
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const getNextStatus = (currentStatus: Task['status']) => {
    const statusFlow = {
      'TODO': 'IN_PROGRESS',
      'IN_PROGRESS': 'REVIEW',
      'REVIEW': 'DONE',
      'DONE': 'TODO',
      'CANCELLED': 'TODO'
    };
    return statusFlow[currentStatus];
  };

  const nextStatus = getNextStatus(task.status);
  const nextStatusOption = statusOptions.find(opt => opt.value === nextStatus);
  const NextIcon = nextStatusOption?.icon || Circle;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={buttonSize}
        onClick={() => onStatusChange(nextStatus)}
        title={`Переместить в "${nextStatusOption?.label}"`}
      >
        <NextIcon className={iconSize} />
      </Button>
    </div>
  );
}

// Компонент для быстрого изменения приоритета
interface QuickPriorityActionsProps {
  task: Task;
  onPriorityChange: (priority: Task['priority']) => void;
  size?: 'sm' | 'md';
}

export function QuickPriorityActions({ 
  task, 
  onPriorityChange, 
  size = 'md' 
}: QuickPriorityActionsProps) {
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const getPriorityColor = (priority: Task['priority']) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const increasePriority = () => {
    const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const currentIndex = priorityOrder.indexOf(task.priority);
    if (currentIndex < priorityOrder.length - 1) {
      onPriorityChange(priorityOrder[currentIndex + 1] as Task['priority']);
    }
  };

  const decreasePriority = () => {
    const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const currentIndex = priorityOrder.indexOf(task.priority);
    if (currentIndex > 0) {
      onPriorityChange(priorityOrder[currentIndex - 1] as Task['priority']);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={buttonSize}
        onClick={decreasePriority}
        disabled={task.priority === 'LOW'}
        title="Понизить приоритет"
      >
        <Flag className={iconSize} />
      </Button>
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={buttonSize}
        onClick={increasePriority}
        disabled={task.priority === 'URGENT'}
        title="Повысить приоритет"
      >
        <Flag className={`${iconSize} fill-current`} />
      </Button>
    </div>
  );
}