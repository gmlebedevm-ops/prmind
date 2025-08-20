'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw,
  Calendar,
  User,
  Tag,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Task } from './task-card';

interface TaskFiltersProps {
  tasks: Task[];
  onFiltersChange: (filters: TaskFiltersState) => void;
  onClearFilters: () => void;
  compact?: boolean;
}

export interface TaskFiltersState {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  tags: string[];
  dueDateFrom: string;
  dueDateTo: string;
  hasOverdue: boolean;
  hasDueSoon: boolean;
  hasNoAssignee: boolean;
  hasNoDueDate: boolean;
}

const statusOptions = [
  { value: 'TODO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'REVIEW', label: 'На проверке' },
  { value: 'DONE', label: 'Выполнено' },
  { value: 'CANCELLED', label: 'Отменено' },
];

const priorityOptions = [
  { value: 'URGENT', label: 'Срочный' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'LOW', label: 'Низкий' },
];

export function TaskFilters({
  tasks,
  onFiltersChange,
  onClearFilters,
  compact = false
}: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFiltersState>({
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

  const [isExpanded, setIsExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Обработчик клика вне области фильтра
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Получаем уникальные значения для фильтров
  const assignees = Array.from(new Set(tasks.map(task => task.assignee?.email).filter(Boolean)));
  const projects = Array.from(new Set(tasks.map(task => task.project.title)));
  const allTags = Array.from(new Set(tasks.flatMap(task => 
    task.tags?.map(tag => tag.name) || []
  )));

  const getActiveFiltersCount = () => {
    return [
      filters.search,
      filters.status.length,
      filters.priority.length,
      filters.assignee.length,
      filters.project.length,
      filters.tags.length,
      filters.dueDateFrom,
      filters.dueDateTo,
      filters.hasOverdue,
      filters.hasDueSoon,
      filters.hasNoAssignee,
      filters.hasNoDueDate,
    ].filter(Boolean).length;
  };

  const updateFilter = (key: keyof TaskFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof TaskFiltersState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    const clearedFilters: TaskFiltersState = {
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
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card ref={filterRef} className={compact ? '' : 'mb-6'}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Фильтры задач
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </CardTitle>
          </div>
          
          {/* Поле поиска занимает всю доступную ширину */}
          <div className="relative flex-grow min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setIsExpanded(true)} />
            <Input
              placeholder="Поиск задач..."
              value={filters.search}
              onChange={(e) => {
                updateFilter('search', e.target.value);
                setIsExpanded(true);
              }}
              className="pl-10 w-full"
              onFocus={() => setIsExpanded(true)}
            />
          </div>
          
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Содержимое фильтров */}
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Статус и приоритет */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status.includes(option.value)}
                      onCheckedChange={() => toggleArrayFilter('status', option.value)}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priority.includes(option.value)}
                      onCheckedChange={() => toggleArrayFilter('priority', option.value)}
                    />
                    <Label htmlFor={`priority-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Проект и исполнитель */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Проект</Label>
              <Select value={filters.project.length === 1 ? filters.project[0] : "all"} onValueChange={(value) => {
                if (value === "all") {
                  updateFilter('project', []);
                } else {
                  updateFilter('project', [value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все проекты</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Select value={filters.assignee.length === 1 ? filters.assignee[0] : "all"} onValueChange={(value) => {
                if (value === "all") {
                  updateFilter('assignee', []);
                } else {
                  updateFilter('assignee', [value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все исполнители</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Теги */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('tags', tag)}
                  >
                    {tag}
                    {filters.tags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Даты */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDateFrom">Срок от</Label>
              <Input
                id="dueDateFrom"
                type="date"
                value={filters.dueDateFrom}
                onChange={(e) => updateFilter('dueDateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDateTo">Срок до</Label>
              <Input
                id="dueDateTo"
                type="date"
                value={filters.dueDateTo}
                onChange={(e) => updateFilter('dueDateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Специальные фильтры */}
          <div className="space-y-2">
            <Label>Специальные фильтры</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOverdue"
                  checked={filters.hasOverdue}
                  onCheckedChange={(checked) => updateFilter('hasOverdue', checked as boolean)}
                />
                <Label htmlFor="hasOverdue" className="text-sm flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Просроченные
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDueSoon"
                  checked={filters.hasDueSoon}
                  onCheckedChange={(checked) => updateFilter('hasDueSoon', checked as boolean)}
                />
                <Label htmlFor="hasDueSoon" className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Скоро срок
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasNoAssignee"
                  checked={filters.hasNoAssignee}
                  onCheckedChange={(checked) => updateFilter('hasNoAssignee', checked as boolean)}
                />
                <Label htmlFor="hasNoAssignee" className="text-sm flex items-center gap-1">
                  <User className="h-4 w-4 text-blue-500" />
                  Без исполнителя
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasNoDueDate"
                  checked={filters.hasNoDueDate}
                  onCheckedChange={(checked) => updateFilter('hasNoDueDate', checked as boolean)}
                />
                <Label htmlFor="hasNoDueDate" className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Без срока
                </Label>
              </div>
            </div>
          </div>

          {/* Активные фильтры */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Активные фильтры</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary">
                    Поиск: {filters.search}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('search', '')}
                    />
                  </Badge>
                )}
                {filters.status.map(status => (
                  <Badge key={status} variant="secondary">
                    Статус: {statusOptions.find(s => s.value === status)?.label}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('status', status)}
                    />
                  </Badge>
                ))}
                {filters.priority.map(priority => (
                  <Badge key={priority} variant="secondary">
                    Приоритет: {priorityOptions.find(p => p.value === priority)?.label}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('priority', priority)}
                    />
                  </Badge>
                ))}
                {filters.project.map(project => (
                  <Badge key={project} variant="secondary">
                    Проект: {project}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('project', [])}
                    />
                  </Badge>
                ))}
                {filters.assignee.map(assignee => (
                  <Badge key={assignee} variant="secondary">
                    Исполнитель: {assignee}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('assignee', [])}
                    />
                  </Badge>
                ))}
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    Тег: {tag}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => toggleArrayFilter('tags', tag)}
                    />
                  </Badge>
                ))}
                {filters.dueDateFrom && (
                  <Badge variant="secondary">
                    Срок от: {filters.dueDateFrom}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('dueDateFrom', '')}
                    />
                  </Badge>
                )}
                {filters.dueDateTo && (
                  <Badge variant="secondary">
                    Срок до: {filters.dueDateTo}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('dueDateTo', '')}
                    />
                  </Badge>
                )}
                {filters.hasOverdue && (
                  <Badge variant="secondary">
                    Просроченные
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('hasOverdue', false)}
                    />
                  </Badge>
                )}
                {filters.hasDueSoon && (
                  <Badge variant="secondary">
                    Скоро срок
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('hasDueSoon', false)}
                    />
                  </Badge>
                )}
                {filters.hasNoAssignee && (
                  <Badge variant="secondary">
                    Без исполнителя
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('hasNoAssignee', false)}
                    />
                  </Badge>
                )}
                {filters.hasNoDueDate && (
                  <Badge variant="secondary">
                    Без срока
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('hasNoDueDate', false)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}