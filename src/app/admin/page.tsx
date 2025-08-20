'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Settings, Database, Users, BarChart3, Plus, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isTestCreating, setIsTestCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleCreateProjectMind = async () => {
    setIsCreating(true);
    setMessage(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setMessage({ type: 'error', text: 'Пользователь не аутентифицирован' });
        return;
      }
      
      const response = await fetch('/api/admin/create-projectmind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Произошла ошибка' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTestProject = async () => {
    setIsTestCreating(true);
    setMessage(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setMessage({ type: 'error', text: 'Пользователь не аутентифицирован' });
        return;
      }
      
      const response = await fetch('/api/admin/test-create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Произошла ошибка' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setIsTestCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
          <p className="text-muted-foreground">У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Панель администратора</h1>
            <p className="text-muted-foreground">
              Управление системой и настройками ProjectMind
            </p>
          </div>

          {/* Сообщение о результате операции */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Карточка создания проекта ProjectMind */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Создать проект ProjectMind
                </CardTitle>
                <CardDescription>
                  Создать новый проект "Разработка ProjectMind" со всеми задачами из CHECKLIST.md
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCreateProjectMind} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать проект'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Карточка тестового создания проекта */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Тестовый проект
                </CardTitle>
                <CardDescription>
                  Создать простой тестовый проект для проверки работы системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCreateTestProject} 
                  disabled={isTestCreating}
                  variant="outline"
                  className="w-full"
                >
                  {isTestCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать тестовый'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Управление пользователями */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Управление пользователями
                </CardTitle>
                <CardDescription>
                  Просмотр и управление пользователями системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Перейти к управлению
                </Button>
              </CardContent>
            </Card>

            {/* Управление системой */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Настройки системы
                </CardTitle>
                <CardDescription>
                  Конфигурация системных параметров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Открыть настройки
                </Button>
              </CardContent>
            </Card>

            {/* База данных */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Управление БД
                </CardTitle>
                <CardDescription>
                  Резервное копирование и восстановление данных
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Управление БД
                </Button>
              </CardContent>
            </Card>

            {/* Аналитика */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Системная аналитика
                </CardTitle>
                <CardDescription>
                  Статистика использования системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Просмотреть аналитику
                </Button>
              </CardContent>
            </Card>

            {/* Логи */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Системные логи
                </CardTitle>
                <CardDescription>
                  Просмотр логов и отладочной информации
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Открыть логи
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Информация о системе</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Версия:</strong> 1.0.0
                  </div>
                  <div>
                    <strong>Окружение:</strong> Разработка
                  </div>
                  <div>
                    <strong>База данных:</strong> SQLite
                  </div>
                  <div>
                    <strong>Фреймворк:</strong> Next.js 15
                  </div>
                  <div>
                    <strong>Статус:</strong> Активна
                  </div>
                  <div>
                    <strong>AI-ассистент:</strong> Подключен
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}