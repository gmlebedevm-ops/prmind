'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';

interface CalendarEvent {
  id: string;
  taskId: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  type: 'start' | 'due' | 'duration';
  task: {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    project: {
      id: string;
      title: string;
      status: string;
    };
    assignee?: {
      id: string;
      name: string;
      email: string;
    };
  };
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

const typeLabels = {
  start: 'Начало',
  due: 'Дедлайн',
  duration: 'Период'
};

const typeColors = {
  start: 'bg-blue-100 text-blue-800',
  due: 'bg-yellow-100 text-yellow-800',
  duration: 'bg-gray-100 text-gray-800'
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/calendar', {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Ошибка загрузки событий календаря:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.start <= date && event.end >= date);
  };

  const getFilteredEvents = () => {
    let filtered = events;
    
    if (filter === 'my') {
      filtered = events.filter(event => event.task.assignee?.id === user?.id);
    } else if (filter === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      filtered = events.filter(event => 
        event.type === 'due' && 
        event.end < today && 
        event.task.status !== 'DONE' && 
        event.task.status !== 'CANCELLED'
      );
    }
    
    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isOverdue = (event: CalendarEvent) => {
    if (event.type !== 'due') return false;
    const today = new Date().toISOString().split('T')[0];
    return event.end < today && event.task.status !== 'DONE' && event.task.status !== 'CANCELLED';
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

  const filteredEvents = getFilteredEvents();
  const todayEvents = getEventsForDate(selectedDate);

  // Группируем события по датам
  const eventsByDate: { [key: string]: CalendarEvent[] } = {};
  filteredEvents.forEach(event => {
    if (!eventsByDate[event.start]) {
      eventsByDate[event.start] = [];
    }
    eventsByDate[event.start].push(event);
  });

  // Сортируем даты
  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6" />
                  Календарь задач
                </h1>
                <p className="text-sm text-muted-foreground">
                  Просмотр задач по датам
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as 'all' | 'my' | 'overdue')}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">Все задачи</option>
                    <option value="my">Мои задачи</option>
                    <option value="overdue">Просроченные</option>
                  </select>
                </div>
                <Button onClick={fetchEvents} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Календарь событий */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Все события</CardTitle>
                  <CardDescription>
                    {filteredEvents.length} событий ({filter === 'all' ? 'всех задач' : filter === 'my' ? 'моих задач' : 'просроченных дедлайнов'})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedDates.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Нет событий для отображения</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sortedDates.map(date => (
                        <div key={date} className="border-l-2 border-gray-200 pl-4">
                          <div className={`mb-3 ${isToday(date) ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                            {formatDate(date)}
                            {isToday(date) && (
                              <Badge variant="secondary" className="ml-2">Сегодня</Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            {eventsByDate[date].map(event => (
                              <div 
                                key={event.id} 
                                className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                                  isOverdue(event) ? 'border-red-200 bg-red-50' : ''
                                }`}
                                onClick={() => setSelectedDate(date)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm">{event.title}</h4>
                                  <Badge className={typeColors[event.type]} variant="secondary">
                                    {typeLabels[event.type]}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <Badge className={statusColors[event.task.status]} variant="secondary">
                                    {statusLabels[event.task.status]}
                                  </Badge>
                                  <Badge className={priorityColors[event.task.priority]} variant="secondary">
                                    {priorityLabels[event.task.priority]}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Проект: {event.task.project.title}
                                  {event.task.assignee && (
                                    <span className="ml-2">
                                      Исполнитель: {event.task.assignee.name || event.task.assignee.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Детали выбранной даты */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{formatDate(selectedDate)}</CardTitle>
                  <CardDescription>
                    {isToday(selectedDate) && (
                      <Badge variant="secondary">Сегодня</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">Нет задач на эту дату</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayEvents.map(event => (
                        <div 
                          key={event.id} 
                          className={`p-3 rounded-lg border ${
                            isOverdue(event) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <Badge className={typeColors[event.type]} variant="secondary">
                              {typeLabels[event.type]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Badge className={statusColors[event.task.status]} variant="secondary">
                              {statusLabels[event.task.status]}
                            </Badge>
                            <Badge className={priorityColors[event.task.priority]} variant="secondary">
                              {priorityLabels[event.task.priority]}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div>Проект: {event.task.project.title}</div>
                            {event.task.assignee && (
                              <div>Исполнитель: {event.task.assignee.name || event.task.assignee.email}</div>
                            )}
                            {event.type === 'duration' && (
                              <div>
                                Период: {new Date(event.start).toLocaleDateString('ru-RU')} - {new Date(event.end).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Статистика */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Всего событий:</span>
                      <span className="font-medium">{filteredEvents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Начало задач:</span>
                      <span className="font-medium">
                        {filteredEvents.filter(e => e.type === 'start').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Дедлайны:</span>
                      <span className="font-medium">
                        {filteredEvents.filter(e => e.type === 'due').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Периоды выполнения:</span>
                      <span className="font-medium">
                        {filteredEvents.filter(e => e.type === 'duration').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Просроченные:</span>
                      <span className="font-medium">
                        {filteredEvents.filter(e => isOverdue(e)).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}