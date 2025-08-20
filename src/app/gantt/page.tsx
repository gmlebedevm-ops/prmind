'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GanttChart, 
  RefreshCw, 
  Users, 
  Calendar, 
  Target,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/hooks/use-auth';

interface GanttTask {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'subtask';
  projectId: string;
  projectName: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  progress: number;
  subtasks?: Array<{
    id: string;
    title: string;
    type: 'subtask';
    status: string;
    startDate?: string;
    endDate?: string;
    completedAt?: string;
    progress: number;
  }>;
}

interface GanttProject {
  id: string;
  title: string;
  description?: string;
  type: 'project';
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  progress: number;
  tasks: GanttTask[];
  members: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const statusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Выполнено',
  CANCELLED: 'Отменено'
};

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const priorityLabels = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный'
};

const projectStatusColors = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const projectStatusLabels = {
  PLANNING: 'Планирование',
  ACTIVE: 'Активный',
  ON_HOLD: 'На паузе',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен'
};

export default function GanttPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  useEffect(() => {
    fetchGanttData();
  }, []);

  const fetchGanttData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }
      
      const response = await fetch('/api/gantt', {
        headers: {
          'X-User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        
        // Выбираем первый проект по умолчанию
        if (data.projects.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0].id);
        }
      } else {
        console.error('Failed to fetch gantt data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных для Гант-диаграммы:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === selectedProject);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getDuration = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (endDate?: string, status?: string) => {
    if (!endDate || status === 'DONE' || status === 'CANCELLED') return false;
    return new Date(endDate) < new Date();
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

  const selectedProjectData = getSelectedProject();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <GanttChart className="h-6 w-6" />
                  Гант-диаграмма
                </h1>
                <p className="text-muted-foreground">
                  Визуализация сроков проектов и задач
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'timeline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('timeline')}
                  >
                    Диаграмма
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Список
                  </Button>
                </div>
                <Button onClick={fetchGanttData} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить
                </Button>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <GanttChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Нет проектов для отображения</h3>
              <p className="text-muted-foreground mb-4">
                Создайте проект с задачами, чтобы увидеть Гант-диаграмму
              </p>
            </div>
          ) : !selectedProjectData ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Выберите проект для отображения</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Информация о проекте */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {selectedProjectData.title}
                      </CardTitle>
                      {selectedProjectData.description && (
                        <CardDescription>{selectedProjectData.description}</CardDescription>
                      )}
                    </div>
                    <Badge className={projectStatusColors[selectedProjectData.status]}>
                      {projectStatusLabels[selectedProjectData.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedProjectData.tasks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Задач</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedProjectData.tasks.filter(t => t.status === 'DONE').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Выполнено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedProjectData.tasks.filter(t => t.status === 'IN_PROGRESS').length}
                      </div>
                      <div className="text-sm text-muted-foreground">В работе</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedProjectData.tasks.filter(t => isOverdue(t.endDate, t.status)).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Просрочено</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Общий прогресс</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedProjectData.progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={selectedProjectData.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Задачи проекта */}
              {viewMode === 'timeline' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Временная шкала задач</h3>
                  <div className="space-y-3">
                    {selectedProjectData.tasks.map((task, index) => (
                      <Card key={task.id} className={`overflow-hidden ${
                        isOverdue(task.endDate, task.status) ? 'border-red-200' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusColors[task.status]} variant="secondary">
                                  {statusLabels[task.status]}
                                </Badge>
                                <Badge className={priorityColors[task.priority]} variant="secondary">
                                  {priorityLabels[task.priority]}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {task.progress.toFixed(0)}%
                              </div>
                              <Progress value={task.progress} className="w-20 h-2 mt-1" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Начало: {formatDate(task.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className={isOverdue(task.endDate, task.status) ? 'text-red-600' : ''}>
                                Дедлайн: {formatDate(task.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {task.assignee ? task.assignee.name || task.assignee.email : 'Не назначен'}
                              </span>
                            </div>
                          </div>

                          {/* Визуальная временная шкала */}
                          <div className="mt-3">
                            <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                              {task.startDate && task.endDate && (
                                <div
                                  className="absolute h-full bg-blue-500 bg-opacity-20 border border-blue-500 rounded"
                                  style={{
                                    left: '0%',
                                    width: '100%'
                                  }}
                                >
                                  <div
                                    className="absolute h-full bg-blue-500 bg-opacity-40"
                                    style={{
                                      left: '0%',
                                      width: `${task.progress}%`
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{formatDate(task.startDate)}</span>
                              <span>{formatDate(task.endDate)}</span>
                            </div>
                          </div>

                          {/* Подзадачи */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200">
                              <h5 className="text-sm font-medium mb-2">Подзадачи:</h5>
                              <div className="space-y-2">
                                {task.subtasks.map(subtask => (
                                  <div key={subtask.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className={`h-3 w-3 ${
                                        subtask.status === 'DONE' ? 'text-green-500' : 'text-gray-400'
                                      }`} />
                                      <span>{subtask.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        className={`${statusColors[subtask.status as keyof typeof statusColors]} text-xs`} 
                                        variant="secondary"
                                      >
                                        {statusLabels[subtask.status as keyof typeof statusLabels]}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {subtask.progress.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Список задач</h3>
                  <div className="space-y-2">
                    {selectedProjectData.tasks.map(task => (
                      <Card key={task.id} className={`hover:shadow-md transition-shadow ${
                        isOverdue(task.endDate, task.status) ? 'border-red-200' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge className={statusColors[task.status]} variant="secondary">
                                  {statusLabels[task.status]}
                                </Badge>
                                <Badge className={priorityColors[task.priority]} variant="secondary">
                                  {priorityLabels[task.priority]}
                                </Badge>
                                {isOverdue(task.endDate, task.status) && (
                                  <Badge variant="destructive">Просрочено</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Длительность: {getDuration(task.startDate, task.endDate)} дней</span>
                                {task.endDate && (
                                  <span className={getDaysLeft(task.endDate) < 0 ? 'text-red-600' : ''}>
                                    Осталось: {getDaysLeft(task.endDate)} дней
                                  </span>
                                )}
                                <span>
                                  Исполнитель: {task.assignee ? task.assignee.name || task.assignee.email : 'Не назначен'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium mb-1">
                                {task.progress.toFixed(0)}%
                              </div>
                              <Progress value={task.progress} className="w-24 h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}