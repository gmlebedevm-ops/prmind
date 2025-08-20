'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Flag
} from 'lucide-react';
import { Task } from './task-card';

interface TaskStatsProps {
  tasks: Task[];
  title?: string;
  compact?: boolean;
  showCharts?: boolean;
}

interface StatsData {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  review: number;
  cancelled: number;
  overdue: number;
  dueSoon: number;
  noAssignee: number;
  noDueDate: number;
  completionRate: number;
  avgPriority: number;
}

export function TaskStats({ 
  tasks, 
  title = "Статистика задач", 
  compact = false,
  showCharts = true 
}: TaskStatsProps) {
  const calculateStats = (): StatsData => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const stats: StatsData = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      todo: 0,
      review: 0,
      cancelled: 0,
      overdue: 0,
      dueSoon: 0,
      noAssignee: 0,
      noDueDate: 0,
      completionRate: 0,
      avgPriority: 0
    };

    let prioritySum = 0;
    let priorityCount = 0;

    tasks.forEach(task => {
      // Статусы
      switch (task.status) {
        case 'DONE':
          stats.completed++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'TODO':
          stats.todo++;
          break;
        case 'REVIEW':
          stats.review++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }

      // Просроченные задачи
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE') {
        stats.overdue++;
      }

      // Задачи со сроком в ближайшие 3 дня
      if (task.dueDate && new Date(task.dueDate) <= threeDaysFromNow && task.status !== 'DONE') {
        stats.dueSoon++;
      }

      // Задачи без исполнителя
      if (!task.assigneeId) {
        stats.noAssignee++;
      }

      // Задачи без срока
      if (!task.dueDate) {
        stats.noDueDate++;
      }

      // Средний приоритет
      const priorityValue = {
        'LOW': 1,
        'MEDIUM': 2,
        'HIGH': 3,
        'URGENT': 4
      }[task.priority];
      
      prioritySum += priorityValue;
      priorityCount++;
    });

    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    stats.avgPriority = priorityCount > 0 ? Math.round((prioritySum / priorityCount) * 10) / 10 : 0;

    return stats;
  };

  const stats = calculateStats();

  // Статистика по проектам
  const projectStats = tasks.reduce((acc, task) => {
    if (!acc[task.project.title]) {
      acc[task.project.title] = {
        total: 0,
        completed: 0,
        inProgress: 0
      };
    }
    acc[task.project.title].total++;
    if (task.status === 'DONE') acc[task.project.title].completed++;
    if (task.status === 'IN_PROGRESS') acc[task.project.title].inProgress++;
    return acc;
  }, {} as Record<string, { total: number; completed: number; inProgress: number }>);

  // Статистика по исполнителям
  const assigneeStats = tasks.reduce((acc, task) => {
    const assigneeName = task.assignee?.name || task.assignee?.email || 'Без исполнителя';
    if (!acc[assigneeName]) {
      acc[assigneeName] = {
        total: 0,
        completed: 0,
        overdue: 0
      };
    }
    acc[assigneeName].total++;
    if (task.status === 'DONE') acc[assigneeName].completed++;
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE') {
      acc[assigneeName].overdue++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; overdue: number }>);

  const getPriorityLabel = (avgPriority: number) => {
    if (avgPriority <= 1.5) return 'Низкий';
    if (avgPriority <= 2.5) return 'Средний';
    if (avgPriority <= 3.5) return 'Высокий';
    return 'Срочный';
  };

  const getPriorityColor = (avgPriority: number) => {
    if (avgPriority <= 1.5) return 'text-green-600';
    if (avgPriority <= 2.5) return 'text-blue-600';
    if (avgPriority <= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Выполнено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">В работе</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Просрочено</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Выполнение</span>
              <span className="text-sm font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Общая статистика по задачам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего задач</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Выполнено</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">В работе</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.review}</div>
              <div className="text-sm text-muted-foreground">На проверке</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Просрочено</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.dueSoon}</div>
              <div className="text-sm text-muted-foreground">Скоро срок</div>
            </div>
          </div>

          {/* Прогресс выполнения */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Общий прогресс выполнения</span>
                <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Выполнение</span>
                <span className="font-semibold text-green-700">{stats.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Активность</span>
                <span className="font-semibold text-blue-700">{stats.inProgress + stats.review}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Проблемы</span>
                <span className="font-semibold text-red-700">{stats.overdue}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* По статусам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Распределение по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'К выполнению', count: stats.todo, color: 'bg-gray-500' },
                { status: 'В работе', count: stats.inProgress, color: 'bg-blue-500' },
                { status: 'На проверке', count: stats.review, color: 'bg-yellow-500' },
                { status: 'Выполнено', count: stats.completed, color: 'bg-green-500' },
                { status: 'Отменено', count: stats.cancelled, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Проблемные задачи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Проблемные задачи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Просроченные</span>
                </div>
                <Badge variant="destructive">{stats.overdue}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Срок в ближайшие 3 дня</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{stats.dueSoon}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Без исполнителя</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{stats.noAssignee}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Без срока выполнения</span>
                </div>
                <Badge variant="outline">{stats.noDueDate}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по проектам */}
      {Object.keys(projectStats).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              По проектам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(projectStats).map(([project, data]) => {
                const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                return (
                  <div key={project} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{project}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.completed}/{data.total}
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium">{completionRate}%</div>
                      <div className="text-xs text-muted-foreground">{data.inProgress} в работе</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span className="text-sm">Средний приоритет</span>
              </div>
              <span className={`font-medium ${getPriorityColor(stats.avgPriority)}`}>
                {getPriorityLabel(stats.avgPriority)} ({stats.avgPriority})
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm">Эффективность</span>
              </div>
              <span className="font-medium text-green-600">
                {stats.completionRate >= 70 ? 'Высокая' : stats.completionRate >= 50 ? 'Средняя' : 'Низкая'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}