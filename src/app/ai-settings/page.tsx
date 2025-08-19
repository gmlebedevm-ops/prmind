'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AISettingsComponent } from '@/components/ai/ai-settings';
import { ArrowLeft, Settings, Bot, Zap } from 'lucide-react';

export default function AISettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Показываем загрузку во время проверки аутентификации
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка настроек AI...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не аутентифицирован, перенаправляем на главную
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Настройки AI-ассистента
                </h1>
                <p className="text-sm text-muted-foreground">
                  Настройте подключение к различным AI-провайдерам
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'ADMIN' ? 'Администратор' : 
                   user.role === 'MANAGER' ? 'Менеджер' : 'Пользователь'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Информационные карточки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Встроенный AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Используйте встроенный Z.AI провайдер для базовых задач. Не требует дополнительной настройки.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                  Локальный AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Подключите LM Studio для использования локальных моделей. Полная конфиденциальность данных.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Облачный AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Подключитесь к OpenAI, Anthropic или другим облачным провайдерам для максимальной мощности.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Компонент настроек */}
          <AISettingsComponent />
        </main>
      </div>
    </ProtectedRoute>
  );
}