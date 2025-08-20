'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bell, Save, Mail, MessageSquare, Calendar, Users } from 'lucide-react';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      taskAssigned: true,
      taskUpdated: true,
      taskCompleted: true,
      projectInvited: true,
      projectUpdated: false,
      commentAdded: true,
      deadlineReminder: true,
    },
    push: {
      enabled: true,
      taskAssigned: true,
      taskUpdated: false,
      taskCompleted: true,
      projectInvited: true,
      projectUpdated: false,
      commentAdded: true,
      deadlineReminder: true,
    },
    inApp: {
      enabled: true,
      taskAssigned: true,
      taskUpdated: true,
      taskCompleted: true,
      projectInvited: true,
      projectUpdated: true,
      commentAdded: true,
      deadlineReminder: true,
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика сохранения настроек уведомлений
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки уведомлений были успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки уведомлений",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const NotificationToggle = ({ 
    type, 
    notification, 
    icon: Icon 
  }: { 
    type: keyof typeof notifications; 
    notification: keyof typeof notifications.email; 
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label className="text-sm font-medium">
            {getNotificationLabel(notification)}
          </Label>
          <p className="text-xs text-muted-foreground">
            {getNotificationDescription(notification)}
          </p>
        </div>
      </div>
      <Switch
        checked={notifications[type][notification]}
        onCheckedChange={(checked) =>
          setNotifications(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              [notification]: checked
            }
          }))
        }
      />
    </div>
  );

  const getNotificationLabel = (notification: string) => {
    const labels: Record<string, string> = {
      taskAssigned: 'Назначение задачи',
      taskUpdated: 'Обновление задачи',
      taskCompleted: 'Завершение задачи',
      projectInvited: 'Приглашение в проект',
      projectUpdated: 'Обновление проекта',
      commentAdded: 'Новый комментарий',
      deadlineReminder: 'Напоминание о сроке',
    };
    return labels[notification] || notification;
  };

  const getNotificationDescription = (notification: string) => {
    const descriptions: Record<string, string> = {
      taskAssigned: 'Уведомлять при назначении новой задачи',
      taskUpdated: 'Уведомлять об изменениях в задаче',
      taskCompleted: 'Уведомлять о завершении задачи',
      projectInvited: 'Уведомлять о приглашении в проект',
      projectUpdated: 'Уведомлять об обновлениях проекта',
      commentAdded: 'Уведомлять о новых комментариях',
      deadlineReminder: 'Напоминать о приближающихся сроках',
    };
    return descriptions[notification] || '';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Уведомления</h1>
        <p className="text-muted-foreground">
          Настройте способы и типы уведомлений
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="push" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Push
          </TabsTrigger>
          <TabsTrigger value="inApp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            В приложении
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email-уведомления
              </CardTitle>
              <CardDescription>
                Настройте получение уведомлений по электронной почте
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить email-уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления на вашу почту
                  </p>
                </div>
                <Switch
                  checked={notifications.email.enabled}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      email: { ...prev.email, enabled: checked }
                    }))
                  }
                />
              </div>

              {notifications.email.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <NotificationToggle
                    type="email"
                    notification="taskAssigned"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="email"
                    notification="taskUpdated"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="email"
                    notification="taskCompleted"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="email"
                    notification="projectInvited"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="email"
                    notification="projectUpdated"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="email"
                    notification="commentAdded"
                    icon={MessageSquare}
                  />
                  <NotificationToggle
                    type="email"
                    notification="deadlineReminder"
                    icon={Calendar}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push-уведомления
              </CardTitle>
              <CardDescription>
                Настройте получение push-уведомлений в браузере
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить push-уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления в браузере
                  </p>
                </div>
                <Switch
                  checked={notifications.push.enabled}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      push: { ...prev.push, enabled: checked }
                    }))
                  }
                />
              </div>

              {notifications.push.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <NotificationToggle
                    type="push"
                    notification="taskAssigned"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="push"
                    notification="taskUpdated"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="push"
                    notification="taskCompleted"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="push"
                    notification="projectInvited"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="push"
                    notification="projectUpdated"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="push"
                    notification="commentAdded"
                    icon={MessageSquare}
                  />
                  <NotificationToggle
                    type="push"
                    notification="deadlineReminder"
                    icon={Calendar}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inApp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Уведомления в приложении
              </CardTitle>
              <CardDescription>
                Настройте отображение уведомлений внутри приложения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить уведомления в приложении</Label>
                  <p className="text-sm text-muted-foreground">
                    Показывать уведомления в интерфейсе приложения
                  </p>
                </div>
                <Switch
                  checked={notifications.inApp.enabled}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({
                      ...prev,
                      inApp: { ...prev.inApp, enabled: checked }
                    }))
                  }
                />
              </div>

              {notifications.inApp.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <NotificationToggle
                    type="inApp"
                    notification="taskAssigned"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="taskUpdated"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="taskCompleted"
                    icon={Calendar}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="projectInvited"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="projectUpdated"
                    icon={Users}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="commentAdded"
                    icon={MessageSquare}
                  />
                  <NotificationToggle
                    type="inApp"
                    notification="deadlineReminder"
                    icon={Calendar}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 space-x-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
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