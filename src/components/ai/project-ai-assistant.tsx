'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  BarChart3, 
  FileText, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  TrendingUp,
  Zap
} from 'lucide-react';

interface ProjectAIAssistantProps {
  projectId: string;
  projectName: string;
  className?: string;
}

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'creation' | 'analysis' | 'planning' | 'optimization';
  action: () => void;
}

export function ProjectAIAssistant({ projectId, projectName, className }: ProjectAIAssistantProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('features');

  const aiFeatures: AIFeature[] = [
    {
      id: 'create-task',
      title: 'Создать задачу через AI',
      description: 'Опишите задачу естественным языком, а AI создаст её с правильными параметрами',
      icon: <Plus className="h-5 w-5" />,
      category: 'creation',
      action: () => setIsCreateTaskOpen(true),
    },
    {
      id: 'analyze-progress',
      title: 'Анализ прогресса',
      description: 'Детальный анализ текущего состояния проекта, выявление проблемных зон',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'analysis',
      action: () => handleAnalyzeProgress(),
    },
    {
      id: 'generate-report',
      title: 'Сгенерировать отчет',
      description: 'Автоматическая генерация отчетов о проекте за выбранный период',
      icon: <FileText className="h-5 w-5" />,
      category: 'analysis',
      action: () => handleGenerateReport(),
    },
    {
      id: 'optimize-timeline',
      title: 'Оптимизировать расписание',
      description: 'AI проанализирует сроки и предложит оптимизацию расписания',
      icon: <Calendar className="h-5 w-5" />,
      category: 'planning',
      action: () => handleOptimizeTimeline(),
    },
    {
      id: 'team-recommendations',
      title: 'Рекомендации для команды',
      description: 'Анализ командной работы и персональные рекомендации',
      icon: <Users className="h-5 w-5" />,
      category: 'optimization',
      action: () => handleTeamRecommendations(),
    },
    {
      id: 'risk-assessment',
      title: 'Оценка рисков',
      description: 'Выявление потенциальных рисков и предложение мер по их снижению',
      icon: <AlertTriangle className="h-5 w-5" />,
      category: 'analysis',
      action: () => handleRiskAssessment(),
    },
  ];

  const handleCreateTask = async () => {
    if (!taskDescription.trim()) return;

    setIsCreating(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Пользователь не аутентифицирован');
        return;
      }
      
      const response = await fetch('/api/ai/create-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          description: taskDescription,
          projectId,
          priority: taskPriority,
          dueDate: taskDueDate || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Показать уведомление об успехе
        alert(`Задача "${result.task.title}" успешно создана!`);
        setIsCreateTaskOpen(false);
        setTaskDescription('');
        setTaskPriority('MEDIUM');
        setTaskDueDate('');
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      alert('Произошла ошибка при создании задачи');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAnalyzeProgress = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Пользователь не аутентифицирован');
        return;
      }
      
      const response = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (result.success) {
        // Показать результаты анализа в модальном окне
        alert(`Анализ завершен! Прогресс: ${result.analysis.progress}%`);
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка анализа:', error);
      alert('Произошла ошибка при анализе проекта');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Пользователь не аутентифицирован');
        return;
      }
      
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          projectId,
          reportType: 'comprehensive',
          timeRange: 'month',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Отчет "${result.report.title}" сгенерирован!`);
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
      alert('Произошла ошибка при генерации отчета');
    }
  };

  const handleOptimizeTimeline = () => {
    alert('Функция оптимизации расписания в разработке');
  };

  const handleTeamRecommendations = () => {
    alert('Функция рекомендаций для команды в разработке');
  };

  const handleRiskAssessment = () => {
    alert('Функция оценки рисков в разработке');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'creation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analysis':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'optimization':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'creation':
        return 'Создание';
      case 'analysis':
        return 'Анализ';
      case 'planning':
        return 'Планирование';
      case 'optimization':
        return 'Оптимизация';
      default:
        return 'Другое';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="relative">
            <Bot className="h-8 w-8 text-blue-600" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">AI-ассистент проекта</h2>
        </div>
        <p className="text-muted-foreground">
          Интеллектуальные инструменты для управления проектом "{projectName}"
        </p>
      </div>

      {/* Диалог создания задачи */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать задачу с помощью AI</DialogTitle>
            <DialogDescription>
              Опишите задачу естественным языком, и AI создаст её с оптимальными параметрами
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Описание задачи</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Например: Нужно добавить форму регистрации на сайт с валидацией email и пароля..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Приоритет</label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                  <SelectItem value="URGENT">Срочный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Срок выполнения (опционально)</label>
              <Input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateTask} 
                disabled={!taskDescription.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Создание...' : 'Создать задачу'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Вкладки с функциями */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="features">AI-функции</TabsTrigger>
          <TabsTrigger value="insights">Инсайты</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiFeatures.map((feature) => (
              <Card 
                key={feature.id}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-l-4 border-l-blue-500"
                onClick={feature.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(feature.category)}`}
                        >
                          {getCategoryLabel(feature.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Эффективность</h3>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  AI анализирует продуктивность команды и предлагает оптимизации
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600">Анализ в реальном времени</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Качество</h3>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  Контроль качества задач и выявление проблем на ранних этапах
                </p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Предиктивный анализ</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Инновации</h3>
                </div>
                <p className="text-sm text-purple-700 mb-2">
                  Умные рекомендации по улучшению процессов и инструментов
                </p>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600">AI-оптимизация</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Как это работает?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Анализ данных:</strong> AI изучает текущее состояние проекта, задачи, сроки и активность команды</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Выявление паттернов:</strong> Обнаружение тенденций, проблемных зон и возможностей для улучшения</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Генерация рекомендаций:</strong> Создание конкретных, практических советов на основе анализа</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Обучение и адаптация:</strong> AI постоянно улучшает свои рекомендации на основе результатов</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}