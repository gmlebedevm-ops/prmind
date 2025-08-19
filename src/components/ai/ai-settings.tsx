'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  TestTube, 
  Save, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Bot,
  Server,
  Cloud,
  Zap,
  Info,
  ExternalLink
} from 'lucide-react';

interface AISettings {
  id: string;
  provider: 'Z_AI' | 'LM_STUDIO' | 'OPENAI' | 'ANTHROPIC' | 'CUSTOM';
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  success: boolean;
  message: string;
  error?: string;
  baseUrl?: string;
  models?: any;
  response?: {
    status: number;
    statusText: string;
    model?: string;
    usage?: any;
  };
}

interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

interface AISettingsProps {
  className?: string;
}

const providerDescriptions = {
  Z_AI: {
    name: 'Z.AI (по умолчанию)',
    description: 'Встроенный AI-провайдер с базовыми возможностями',
    icon: <Bot className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
    requiredFields: [] as string[],
  },
  LM_STUDIO: {
    name: 'LM Studio',
    description: 'Локальные модели через LM Studio на вашем компьютере',
    icon: <Server className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
    requiredFields: ['baseUrl'],
    helpUrl: 'https://lmstudio.ai/',
  },
  OPENAI: {
    name: 'OpenAI',
    description: 'Модели OpenAI (GPT-3.5, GPT-4 и др.)',
    icon: <Cloud className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
    requiredFields: ['apiKey'],
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  ANTHROPIC: {
    name: 'Anthropic',
    description: 'Модели Anthropic Claude',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800',
    requiredFields: ['apiKey'],
    helpUrl: 'https://console.anthropic.com/',
  },
  CUSTOM: {
    name: 'Кастомный API',
    description: 'Любой OpenAI-совместимый API',
    icon: <Settings className="h-5 w-5" />,
    color: 'bg-gray-100 text-gray-800',
    requiredFields: ['baseUrl'],
  },
};

const defaultModels = {
  LM_STUDIO: 'auto',
  OPENAI: 'gpt-3.5-turbo',
  ANTHROPIC: 'claude-3-sonnet-20240229',
  CUSTOM: '',
};

export function AISettingsComponent({ className }: AISettingsProps) {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    provider: 'Z_AI' as const,
    baseUrl: '',
    model: '',
    apiKey: '',
    maxTokens: 1000,
    temperature: 0.7,
    enabled: true,
  });

  useEffect(() => {
    loadSettings();
    
    // Очистка таймера при размонтировании
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('/api/ai/settings', {
        headers: {
          'X-User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setFormData({
          provider: data.settings.provider,
          baseUrl: data.settings.baseUrl || '',
          model: data.settings.model || 'auto', // Преобразуем пустую строку в "auto" для Select
          apiKey: data.settings.apiKey || '',
          maxTokens: data.settings.maxTokens,
          temperature: data.settings.temperature,
          enabled: data.settings.enabled,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // Подготавливаем данные для сохранения, преобразуя "auto" в пустую строку
      const saveData = {
        ...formData,
        model: formData.model === 'auto' ? '' : formData.model
      };

      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(saveData),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        // Показываем уведомление об успехе
        alert('Настройки успешно сохранены!');
      } else {
        const error = await response.json();
        alert(`Ошибка сохранения: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      alert('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Для LM Studio используем клиентскую проверку, так как сервер не может достучаться до локальных адресов
      if (formData.provider === 'LM_STUDIO') {
        await testLMStudioClient();
      } else {
        // Для других провайдеров используем серверную проверку
        await testConnectionServer();
      }
    } catch (error) {
      console.error('Ошибка тестирования подключения:', error);
      setTestResult({
        success: false,
        message: 'Ошибка тестирования подключения',
      });
    } finally {
      setTesting(false);
    }
  };

  const testConnectionServer = async () => {
    try {
      // Временно убираем проверку userId для тестирования
      const response = await fetch('/api/ai/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Временно убираем X-User-ID для тестирования
        },
        body: JSON.stringify({
          ...formData,
          testMessage: 'Привет! Это тестовое сообщение для проверки подключения.',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
        
        // Если тест успешен и это LM Studio, обновляем список моделей
        if (result.success && formData.provider === 'LM_STUDIO' && result.models && result.models.data) {
          const models = result.models.data.map((model: any) => ({
            id: model.id,
            name: model.id,
            description: `Модель: ${model.id}`,
          }));
          setAvailableModels(models);
        }
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: error.error || 'Ошибка тестирования подключения',
        });
      }
    } catch (error) {
      console.error('Ошибка серверного тестирования:', error);
      setTestResult({
        success: false,
        message: 'Ошибка тестирования подключения',
      });
    }
  };

  const testLMStudioClient = async () => {
    if (!formData.baseUrl) {
      setTestResult({
        success: false,
        message: 'Базовый URL не указан',
      });
      return;
    }

    try {
      // Нормализуем URL
      let normalizedUrl = formData.baseUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'http://' + normalizedUrl;
      }
      
      // Удаляем слэш в конце, если он есть
      normalizedUrl = normalizedUrl.replace(/\/$/, '');

      const urlsToTest = [
        normalizedUrl,
        `${normalizedUrl}/v1`
      ].filter((url, index, self) => self.indexOf(url) === index);

      console.log(`Клиентское тестирование LM Studio URLs:`, urlsToTest);

      for (const url of urlsToTest) {
        try {
          console.log(`Клиентское тестирование LM Studio URL: ${url}`);
          
          // Сначала пробуем получить модели - это основной способ проверки
          const modelsUrl = url.endsWith('/v1') ? `${url}/models` : `${url}/v1/models`;
          console.log(`Попытка получить модели с: ${modelsUrl}`);
          
          const modelsResponse = await fetch(modelsUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(10000)
          });

          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            console.log('Модели получены успешно:', modelsData);
            
            // Обновляем список моделей
            if (modelsData.data) {
              const models = modelsData.data.map((model: any) => ({
                id: model.id,
                name: model.id,
                description: `Модель: ${model.id}`,
              }));
              setAvailableModels(models);
              
              // Если нет выбранной модели, выбираем первую из списка
              if (!formData.model && models.length > 0) {
                setFormData(prev => ({ ...prev, model: models[0].id }));
              }
            }
            
            const clientTestResult = {
              success: true,
              message: 'Подключение к LM Studio успешно установлено',
              baseUrl: url,
              models: modelsData,
              response: {
                status: modelsResponse.status,
                statusText: modelsResponse.statusText
              }
            };

            // Отправляем результат на сервер для сохранения
            try {
              const serverResponse = await fetch('/api/ai/settings/client-test', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  provider: 'LM_STUDIO',
                  testResult: clientTestResult
                }),
              });

              if (serverResponse.ok) {
                const serverResult = await serverResponse.json();
                setTestResult(serverResult);
              } else {
                // Если сервер не принял результат, все равно показываем успешный результат
                setTestResult(clientTestResult);
              }
            } catch (serverError) {
              console.error('Ошибка отправки результата на сервер:', serverError);
              // Все равно показываем успешный результат
              setTestResult(clientTestResult);
            }
            
            return;
          } else {
            console.log(`Не удалось получить модели с ${modelsUrl}, статус: ${modelsResponse.status}`);
            
            // Если не удалось получить модели, пробуем базовый URL
            const baseResponse = await fetch(url, {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });

            if (baseResponse.ok) {
              console.log(`Базовое подключение к ${url} успешно`);
              
              const clientTestResult = {
                success: true,
                message: 'Подключение к LM Studio установлено (базовая проверка)',
                baseUrl: url,
                response: {
                  status: baseResponse.status,
                  statusText: baseResponse.statusText
                }
              };

              // Отправляем результат на сервер
              try {
                const serverResponse = await fetch('/api/ai/settings/client-test', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    provider: 'LM_STUDIO',
                    testResult: clientTestResult
                  }),
                });

                if (serverResponse.ok) {
                  const serverResult = await serverResponse.json();
                  setTestResult(serverResult);
                } else {
                  setTestResult(clientTestResult);
                }
              } catch (serverError) {
                console.error('Ошибка отправки результата на сервер:', serverError);
                setTestResult(clientTestResult);
              }
              
              return;
            }
          }
        } catch (error) {
          console.log(`Ошибка при клиентском тестировании ${url}:`, error);
          continue; // Пробуем следующий URL
        }
      }

      // Если все URL не сработали
      const clientTestResult = {
        success: false,
        error: 'Ошибка подключения',
        message: 'Не удалось подключиться к LM Studio. Проверьте URL и убедитесь, что LM Studio запущен.'
      };

      // Отправляем результат на сервер
      try {
        const serverResponse = await fetch('/api/ai/settings/client-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'LM_STUDIO',
            testResult: clientTestResult
          }),
        });

        if (serverResponse.ok) {
          const serverResult = await serverResponse.json();
          setTestResult(serverResult);
        } else {
          setTestResult(clientTestResult);
        }
      } catch (serverError) {
        console.error('Ошибка отправки результата на сервер:', serverError);
        setTestResult(clientTestResult);
      }
    } catch (error) {
      console.error('Ошибка клиентского тестирования:', error);
      setTestResult({
        success: false,
        error: 'Ошибка подключения',
        message: `Не удалось подключиться к LM Studio: ${error.message}`
      });
    }
  };

  const loadAvailableModels = async (baseUrl: string) => {
    if (!baseUrl) return;
    
    setLoadingModels(true);
    try {
      // Для LM Studio используем клиентскую проверку
      if (formData.provider === 'LM_STUDIO') {
        await loadModelsClient(baseUrl);
      } else {
        // Для других провайдеров используем серверную проверку
        await loadModelsServer(baseUrl);
      }
    } catch (error) {
      setAvailableModels([]);
      console.error('Ошибка загрузки моделей:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadModelsServer = async (baseUrl: string) => {
    try {
      // Временно убираем проверку userId для тестирования
      const response = await fetch('/api/ai/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Временно убираем X-User-ID для тестирования
        },
        body: JSON.stringify({
          provider: 'LM_STUDIO',
          baseUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.models && result.models.data) {
          const models = result.models.data.map((model: any) => ({
            id: model.id,
            name: model.id,
            description: `Модель: ${model.id}`,
          }));
          setAvailableModels(models);
          
          // Если нет выбранной модели, выбираем первую из списка
          if (!formData.model && models.length > 0) {
            setFormData(prev => ({ ...prev, model: models[0].id }));
          }
        } else {
          setAvailableModels([]);
          console.warn('Модели не найдены в ответе сервера');
        }
      } else {
        setAvailableModels([]);
        console.error('Ошибка загрузки моделей: сервер вернул ошибку');
      }
    } catch (error) {
      setAvailableModels([]);
      console.error('Ошибка серверной загрузки моделей:', error);
    }
  };

  const loadModelsClient = async (baseUrl: string) => {
    try {
      // Нормализуем URL
      let normalizedUrl = baseUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'http://' + normalizedUrl;
      }
      
      // Удаляем слэш в конце, если он есть
      normalizedUrl = normalizedUrl.replace(/\/$/, '');

      const urlsToTest = [
        normalizedUrl,
        `${normalizedUrl}/v1`
      ].filter((url, index, self) => self.indexOf(url) === index);

      console.log(`Клиентская загрузка моделей LM Studio URLs:`, urlsToTest);

      for (const url of urlsToTest) {
        try {
          console.log(`Клиентская загрузка моделей с LM Studio URL: ${url}`);
          
          // Пробуем получить модели
          const modelsUrl = url.endsWith('/v1') ? `${url}/models` : `${url}/v1/models`;
          console.log(`Попытка получить модели с: ${modelsUrl}`);
          
          const modelsResponse = await fetch(modelsUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(10000)
          });

          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            console.log('Модели получены успешно:', modelsData);
            
            if (modelsData.data) {
              const models = modelsData.data.map((model: any) => ({
                id: model.id,
                name: model.id,
                description: `Модель: ${model.id}`,
              }));
              setAvailableModels(models);
              
              // Если нет выбранной модели, выбираем первую из списка
              if (!formData.model && models.length > 0) {
                setFormData(prev => ({ ...prev, model: models[0].id }));
              }
            }
            return;
          } else {
            console.log(`Не удалось получить модели с ${modelsUrl}, статус: ${modelsResponse.status}`);
            continue; // Пробуем следующий URL
          }
        } catch (error) {
          console.log(`Ошибка при клиентской загрузке моделей с ${url}:`, error);
          continue; // Пробуем следующий URL
        }
      }

      // Если все URL не сработали
      setAvailableModels([]);
      console.warn('Не удалось загрузить модели с LM Studio');
    } catch (error) {
      setAvailableModels([]);
      console.error('Ошибка клиентской загрузки моделей:', error);
    }
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    setFormData(prev => ({ ...prev, baseUrl }));
    setTestResult(null);
    
    // Очищаем предыдущий таймер
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Если выбран LM Studio, загружаем модели с задержкой (debounce)
    if (formData.provider === 'LM_STUDIO' && baseUrl) {
      const timer = setTimeout(() => {
        loadAvailableModels(baseUrl);
      }, 1000); // Задержка 1 секунда
      setDebounceTimer(timer);
    } else {
      setAvailableModels([]);
    }
  };

  const handleProviderChange = async (provider: keyof typeof providerDescriptions, currentBaseUrl: string = formData.baseUrl) => {
    setFormData(prev => ({
      ...prev,
      provider,
      model: defaultModels[provider] || '',
    }));
    setTestResult(null);
    setAvailableModels([]);
    
    // Если выбран LM Studio, автоматически загружаем список моделей
    if (provider === 'LM_STUDIO' && currentBaseUrl) {
      await loadAvailableModels(currentBaseUrl);
    }
  };

  const currentProvider = providerDescriptions[formData.provider];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка настроек...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Настройки AI-ассистента</h2>
          <p className="text-muted-foreground">
            Настройте подключение к различным AI-провайдерам
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formData.enabled ? "default" : "secondary"}>
            {formData.enabled ? "Включен" : "Выключен"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Настройки подключения</TabsTrigger>
          <TabsTrigger value="test">Тестирование</TabsTrigger>
          <TabsTrigger value="advanced">Расширенные</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Выберите провайдера и настройте параметры подключения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Выбор провайдера */}
              <div className="space-y-2">
                <Label htmlFor="provider">AI-провайдер</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите провайдера" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(providerDescriptions).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {provider.icon}
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentProvider.helpUrl && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>
                      Документация:{' '}
                      <a 
                        href={currentProvider.helpUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {currentProvider.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </div>
                )}
              </div>

              {/* Описание провайдера */}
              <Alert>
                <AlertDescription className="flex items-start gap-2">
                  {currentProvider.icon}
                  <div>
                    <strong>{currentProvider.name}:</strong> {currentProvider.description}
                  </div>
                </AlertDescription>
              </Alert>

              <Separator />

              {/* Обязательные поля для провайдера */}
              {currentProvider.requiredFields.includes('baseUrl') && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Базовый URL *</Label>
                  <Input
                    id="baseUrl"
                    placeholder="http://localhost:1234"
                    value={formData.baseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Для LM Studio обычно: http://localhost:1234
                  </p>
                </div>
              )}

              {currentProvider.requiredFields.includes('apiKey') && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API ключ *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Введите API ключ"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
              )}

              {/* Опциональные поля */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Модель</Label>
                  {formData.provider === 'LM_STUDIO' ? (
                    <div className="space-y-2">
                      {loadingModels ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-blue-50">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-blue-800">Загрузка моделей...</span>
                        </div>
                      ) : availableModels.length > 0 ? (
                        <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите модель" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Автоматический выбор</SelectItem>
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{model.name}</span>
                                  {model.description && (
                                    <span className="text-xs text-muted-foreground">{model.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : formData.baseUrl ? (
                        <div className="space-y-2">
                          <Input
                            id="model"
                            placeholder="Введите название модели"
                            value={formData.model}
                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                          />
                          <div className="flex items-center gap-2 p-2 border rounded-md bg-yellow-50">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">Модели не загружены. Проверьте URL подключения.</span>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id="model"
                          placeholder="Введите название модели"
                          value={formData.model}
                          onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {availableModels.length > 0 
                          ? `Доступно ${availableModels.length} моделей`
                          : formData.baseUrl 
                            ? 'Введите корректный URL для загрузки списка моделей'
                            : 'Введите базовый URL для автоматической загрузки моделей'
                        }
                      </p>
                      {formData.baseUrl && formData.provider === 'LM_STUDIO' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => loadAvailableModels(formData.baseUrl)}
                          disabled={loadingModels}
                          className="w-full"
                        >
                          {loadingModels ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <Bot className="h-4 w-4 mr-2" />
                              Обновить список моделей
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Input
                      id="model"
                      placeholder="Название модели"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Максимальное количество токенов</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="8000"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 1000 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Температура: {formData.temperature}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Более консервативный</span>
                  <span>Более креативный</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Включить AI-ассистента</Label>
              </div>

              {/* Секция тестирования подключения */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  <h4 className="font-medium">Тестирование подключения</h4>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={currentProvider.color}>
                    {currentProvider.icon}
                    <span className="ml-2">{currentProvider.name}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Текущий провайдер
                  </span>
                </div>

                <Button onClick={handleTestConnection} disabled={testing} className="w-full">
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Тестировать подключение
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className={`flex items-start gap-3 p-4 rounded-lg ${
                    testResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Подключение успешно' : 'Ошибка подключения'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResult.message}
                      </p>
                      {testResult.response && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Ответ сервера:</p>
                          <p className="text-sm text-gray-600">
                            Статус: {testResult.response.status} {testResult.response.statusText}
                          </p>
                          {testResult.response.model && (
                            <p className="text-sm text-gray-600">
                              Модель: {testResult.response.model}
                            </p>
                          )}
                          {testResult.response.usage && (
                            <p className="text-sm text-gray-600">
                              Использование токенов: {JSON.stringify(testResult.response.usage)}
                            </p>
                          )}
                        </div>
                      )}
                      {testResult.baseUrl && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border">
                          <p className="text-sm font-medium text-blue-700 mb-1">Рабочий URL:</p>
                          <p className="text-sm text-blue-600">{testResult.baseUrl}</p>
                        </div>
                      )}
                      {testResult.models && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-2">Доступные модели:</p>
                          <div className="max-h-40 overflow-y-auto">
                            {testResult.models.data && Array.isArray(testResult.models.data) ? (
                              <ul className="space-y-1">
                                {testResult.models.data.map((model: any, index: number) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {model.id}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(testResult.models, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить настройки
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Тестирование подключения
              </CardTitle>
              <CardDescription>
                Функции тестирования подключения перенесены в раздел "Настройки подключения"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5" />
                  <div>
                    <strong>Внимание:</strong> Функции тестирования подключения теперь доступны непосредственно в разделе настроек подключения. Это позволяет тестировать подключение сразу после изменения параметров.
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Тестирование перемещено</h3>
                <p className="text-muted-foreground">
                  Перейдите на вкладку "Настройки подключения" для тестирования соединения
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Расширенные настройки</CardTitle>
              <CardDescription>
                Дополнительные параметры и информация
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Максимальное количество токенов</Label>
                  <p className="text-sm text-muted-foreground">
                    Ограничивает длину ответа AI. Рекомендуемые значения: 500-2000
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Температура</Label>
                  <p className="text-sm text-muted-foreground">
                    Контролирует случайность ответов. 0 = детерминированный, 1 = креативный
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Рекомендации для LM Studio:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Скачайте и установите LM Studio с официального сайта</li>
                  <li>• Загрузите модель через интерфейс LM Studio (рекомендуемые: Gemma, Qwen, DeepSeek)</li>
                  <li>• Запустите локальный сервер в LM Studio (обычно на порту 1234)</li>
                  <li>• Используйте адрес http://localhost:1234 для подключения</li>
                  <li>• Убедитесь, что модель поддерживает чат-комpletions</li>
                  <li>• Если возникает ошибка, проверьте, что сервер LM Studio запущен</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Поддерживаемые форматы:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• OpenAI-compatible API (LM Studio, OpenAI, кастомные)</p>
                  <p>• Anthropic API (Claude модели)</p>
                  <p>• Z.AI SDK (встроенный провайдер)</p>
                </div>
              </div>

              {settings && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Информация о настройках:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Создано: {new Date(settings.createdAt).toLocaleString('ru-RU')}</p>
                      <p>• Обновлено: {new Date(settings.updatedAt).toLocaleString('ru-RU')}</p>
                      <p>• Провайдер: {providerDescriptions[settings.provider].name}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}