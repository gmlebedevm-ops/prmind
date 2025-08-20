'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      taskUpdates: true,
      projectUpdates: false,
    },
    appearance: {
      theme: 'light',
      language: 'ru',
    },
    general: {
      autoSave: true,
      defaultView: 'list',
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки были успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управляйте настройками приложения и профиля
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Общие настройки
              </CardTitle>
              <CardDescription>
                Основные настройки приложения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Автосохранение</Label>
                  <p className="text-sm text-muted-foreground">
                    Автоматически сохранять изменения
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.general.autoSave}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, autoSave: checked }
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultView">Вид по умолчанию</Label>
                <select
                  id="defaultView"
                  value={settings.general.defaultView}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, defaultView: e.target.value }
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="list">Список</option>
                  <option value="grid">Сетка</option>
                  <option value="kanban">Канбан</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>
                Настройте способ получения уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email-уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления по электронной почте
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push-уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать push-уведомления в браузере
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskUpdates">Обновления задач</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять об изменениях в задачах
                  </p>
                </div>
                <Switch
                  id="taskUpdates"
                  checked={settings.notifications.taskUpdates}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, taskUpdates: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="projectUpdates">Обновления проектов</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять об изменениях в проектах
                  </p>
                </div>
                <Switch
                  id="projectUpdates"
                  checked={settings.notifications.projectUpdates}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, projectUpdates: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Внешний вид</CardTitle>
              <CardDescription>
                Настройте внешний вид приложения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Тема</Label>
                <select
                  id="theme"
                  value={settings.appearance.theme}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: e.target.value }
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="light">Светлая</option>
                  <option value="dark">Тёмная</option>
                  <option value="system">Системная</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Язык</Label>
                <select
                  id="language"
                  value={settings.appearance.language}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, language: e.target.value }
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 space-x-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Сбросить
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}