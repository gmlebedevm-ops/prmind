'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  Calendar,
  User
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
  };
  projectsByStatus: {
    PLANNING: number;
    ACTIVE: number;
    ON_HOLD: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
    CANCELLED: number;
  };
  tasksByPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  overdueTasks: number;
  upcomingDeadlines: Array<{
    taskId: string;
    taskTitle: string;
    projectTitle: string;
    dueDate: string;
    daysLeft: number;
  }>;
  userWorkload: Array<{
    userId: string;
    userName: string;
    assignedTasks: number;
    completedTasks: number;
  }>;
}

const statusColors = {
  PLANNING: '#3B82F6',
  ACTIVE: '#10B981',
  ON_HOLD: '#F59E0B',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444'
};

const statusLabels = {
  PLANNING: 'Планирование',
  ACTIVE: 'Активные',
  ON_HOLD: 'На паузе',
  COMPLETED: 'Завершены',
  CANCELLED: 'Отменены'
};

const taskStatusColors = {
  TODO: '#6B7280',
  IN_PROGRESS: '#3B82F6',
  REVIEW: '#F59E0B',
  DONE: '#10B981',
  CANCELLED: '#EF4444'
};

const taskStatusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Выполнено',
  CANCELLED: 'Отменено'
};

const priorityColors = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  URGENT: '#DC2626'
};

const priorityLabels = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный'
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/analytics', {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
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

  if (!analytics) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Ошибка загрузки данных</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Подготовка данных для графиков
  const projectStatusData = Object.entries(analytics.projectsByStatus).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels],
    value: count,
    color: statusColors[status as keyof typeof statusColors]
  }));

  const taskStatusData = Object.entries(analytics.tasksByStatus).map(([status, count]) => ({
    name: taskStatusLabels[status as keyof typeof taskStatusLabels],
    value: count,
    color: taskStatusColors[status as keyof typeof taskStatusColors]
  }));

  const priorityData = Object.entries(analytics.tasksByPriority).map(([priority, count]) => ({
    name: priorityLabels[priority as keyof typeof priorityLabels],
    value: count,
    color: priorityColors[priority as keyof typeof priorityColors]
  }));

  const completionRate = analytics.overview.totalTasks > 0 
    ? (analytics.overview.completedTasks / analytics.overview.totalTasks) * 100 
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Аналитика и отчеты</h1>
                <p className="text-sm text-muted-foreground">
                  Обзор проектов и задач
                </p>
              </div>
              <Button onClick={fetchAnalytics} variant="outline">
                Обновить данные
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего проектов</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.activeProjects} активных
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.completedTasks} выполнено
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Процент выполнения</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Просроченные задачи</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Требуют внимания
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList>
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
              <TabsTrigger value="deadlines">Сроки</TabsTrigger>
              {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                <TabsTrigger value="workload">Загрузка</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Статусы проектов</CardTitle>
                    <CardDescription>Распределение проектов по статусам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Статистика проектов</CardTitle>
                    <CardDescription>Детальная информация по проектам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.projectsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                            />
                            <span className="text-sm">
                              {statusLabels[status as keyof typeof statusLabels]}
                            </span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Статусы задач</CardTitle>
                    <CardDescription>Распределение задач по статусам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={taskStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Приоритеты задач</CardTitle>
                    <CardDescription>Распределение задач по приоритетам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deadlines" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ближайшие дедлайны</CardTitle>
                  <CardDescription>Задачи со сроком выполнения в ближайшие 7 дней</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Нет ближайших дедлайнов</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.upcomingDeadlines.map((deadline) => (
                        <div key={deadline.taskId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{deadline.taskTitle}</h4>
                            <p className="text-sm text-muted-foreground">{deadline.projectTitle}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={deadline.daysLeft <= 3 ? "destructive" : "secondary"}>
                              {deadline.daysLeft} дн.
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(deadline.dueDate).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <TabsContent value="workload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Загрузка сотрудников</CardTitle>
                    <CardDescription>Распределение задач между сотрудниками</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.userWorkload.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Нет данных о загрузке</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {analytics.userWorkload.map((workload) => {
                          const completionRate = workload.assignedTasks > 0 
                            ? (workload.completedTasks / workload.assignedTasks) * 100 
                            : 0;
                          
                          return (
                            <div key={workload.userId} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{workload.userName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {workload.completedTasks} из {workload.assignedTasks} задач выполнено
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{workload.assignedTasks} задач</Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {completionRate.toFixed(1)}% выполнено
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}