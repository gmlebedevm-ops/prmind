import { z } from 'zod';

// Схема для настроек AI
const aiSettingsSchema = z.object({
  provider: z.enum(['Z_AI', 'LM_STUDIO', 'OPENAI', 'ANTHROPIC', 'CUSTOM']),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  maxTokens: z.number(),
  temperature: z.number(),
  enabled: z.boolean(),
});

export type AISettings = z.infer<typeof aiSettingsSchema>;

// Интерфейс для ответа AI
interface AIResponse {
  content: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Интерфейс для провайдера AI
interface AIProvider {
  name: string;
  generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse>;
  testConnection(settings: AISettings, testMessage: string): Promise<{success: boolean; message: string; response?: string; modelInfo?: any}>;
}

// Z.AI провайдер
class ZAIProvider implements AIProvider {
  name = 'Z_AI';

  async generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse> {
    try {
      // Динамический импорт для работы на сервере
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const completion = await zai.chat.completions.create({
        messages,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      return {
        content,
        model: 'z-ai-model',
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
          total_tokens: completion.usage?.total_tokens,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка Z.AI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(settings: AISettings, testMessage: string) {
    try {
      const response = await this.generateCompletion(settings, [
        { role: 'user', content: testMessage }
      ]);
      
      return {
        success: true,
        message: 'Подключение к Z.AI успешно установлено',
        response: response.content,
        modelInfo: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения к Z.AI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };
    }
  }
}

// LM Studio провайдер
class LMStudioProvider implements AIProvider {
  name = 'LM_STUDIO';

  async generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse> {
    if (!settings.baseUrl) {
      throw new Error('Базовый URL обязателен для LM Studio');
    }

    try {
      // Нормализуем URL
      let normalizedUrl = settings.baseUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'http://' + normalizedUrl;
      }
      
      // Удаляем слэш в конце, если он есть
      normalizedUrl = normalizedUrl.replace(/\/$/, '');

      // Пробуем разные варианты URL для chat completions
      const urlsToTest = [
        `${normalizedUrl}/v1/chat/completions`,
        `${normalizedUrl}/chat/completions`
      ];

      let lastError;
      for (const chatUrl of urlsToTest) {
        try {
          console.log(`Попытка отправить запрос на: ${chatUrl}`);
          
          // Определяем модель - если "auto" или пустая строка, не указываем модель (LM Studio выберет автоматически)
          const model = settings.model && settings.model !== 'auto' ? settings.model : undefined;
          
          const requestBody = {
            messages,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            stream: false,
          };
          
          // Добавляем модель только если она указана и не равна "auto"
          if (model) {
            requestBody.model = model;
          }
          
          console.log(`Тело запроса:`, JSON.stringify(requestBody, null, 2));
          
          const response = await fetch(chatUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log(`Ответ от ${chatUrl}:`, response.status, response.statusText);

          if (response.ok) {
            const data = await response.json();
            console.log('Данные ответа:', data);
            
            const content = data.choices?.[0]?.message?.content || '';
            if (!content) {
              throw new Error('Пустой ответ от LM Studio');
            }

            return {
              content,
              model: data.model || model || 'unknown',
              usage: data.usage,
            };
          } else {
            const errorText = await response.text();
            console.log(`Ошибка ответа от ${chatUrl}:`, errorText);
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (error) {
          console.log(`Ошибка при запросе к ${chatUrl}:`, error);
          lastError = error;
          continue; // Пробуем следующий URL
        }
      }

      throw lastError || new Error('Не удалось подключиться к LM Studio');
    } catch (error) {
      throw new Error(`Ошибка LM Studio: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(settings: AISettings, testMessage: string) {
    try {
      const response = await this.generateCompletion(settings, [
        { role: 'user', content: testMessage }
      ]);
      
      return {
        success: true,
        message: 'Подключение к LM Studio успешно установлено',
        response: response.content,
        modelInfo: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения к LM Studio: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };
    }
  }
}

// OpenAI провайдер
class OpenAIProvider implements AIProvider {
  name = 'OPENAI';

  async generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse> {
    if (!settings.apiKey) {
      throw new Error('API ключ обязателен для OpenAI');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-3.5-turbo',
          messages,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        content,
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      throw new Error(`Ошибка OpenAI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(settings: AISettings, testMessage: string) {
    try {
      const response = await this.generateCompletion(settings, [
        { role: 'user', content: testMessage }
      ]);
      
      return {
        success: true,
        message: 'Подключение к OpenAI успешно установлено',
        response: response.content,
        modelInfo: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения к OpenAI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };
    }
  }
}

// Anthropic провайдер
class AnthropicProvider implements AIProvider {
  name = 'ANTHROPIC';

  async generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse> {
    if (!settings.apiKey) {
      throw new Error('API ключ обязателен для Anthropic');
    }

    try {
      // Конвертируем сообщения в формат Anthropic
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-sonnet-20240229',
          max_tokens: settings.maxTokens,
          messages: anthropicMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      return {
        content,
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      throw new Error(`Ошибка Anthropic: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(settings: AISettings, testMessage: string) {
    try {
      const response = await this.generateCompletion(settings, [
        { role: 'user', content: testMessage }
      ]);
      
      return {
        success: true,
        message: 'Подключение к Anthropic успешно установлено',
        response: response.content,
        modelInfo: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения к Anthropic: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };
    }
  }
}

// Кастомный провайдер (OpenAI-совместимый)
class CustomProvider implements AIProvider {
  name = 'CUSTOM';

  async generateCompletion(settings: AISettings, messages: Array<{role: string; content: string}>): Promise<AIResponse> {
    if (!settings.baseUrl) {
      throw new Error('Базовый URL обязателен для кастомного провайдера');
    }

    try {
      const response = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model || 'default',
          messages,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        content,
        model: data.model || settings.model || 'unknown',
        usage: data.usage,
      };
    } catch (error) {
      throw new Error(`Ошибка кастомного провайдера: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(settings: AISettings, testMessage: string) {
    try {
      const response = await this.generateCompletion(settings, [
        { role: 'user', content: testMessage }
      ]);
      
      return {
        success: true,
        message: 'Подключение к кастомному API успешно установлено',
        response: response.content,
        modelInfo: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения к кастомному API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };
    }
  }
}

// Фабрика провайдеров
class AIProviderFactory {
  private static providers: Map<string, AIProvider> = new Map();

  static {
    this.providers.set('Z_AI', new ZAIProvider());
    this.providers.set('LM_STUDIO', new LMStudioProvider());
    this.providers.set('OPENAI', new OpenAIProvider());
    this.providers.set('ANTHROPIC', new AnthropicProvider());
    this.providers.set('CUSTOM', new CustomProvider());
  }

  static getProvider(providerName: string): AIProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Неизвестный провайдер: ${providerName}`);
    }
    return provider;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Основная функция для генерации ответа AI
export async function generateAIResponse(
  settings: AISettings,
  messages: Array<{role: string; content: string}>
): Promise<AIResponse> {
  if (!settings.enabled) {
    throw new Error('AI-ассистент отключен в настройках');
  }

  const provider = AIProviderFactory.getProvider(settings.provider);
  return await provider.generateCompletion(settings, messages);
}

// Функция для тестирования подключения
export async function testAIConnection(
  settings: AISettings,
  testMessage: string
): Promise<{success: boolean; message: string; response?: string; modelInfo?: any}> {
  const provider = AIProviderFactory.getProvider(settings.provider);
  return await provider.testConnection(settings, testMessage);
}

// Функция для получения настроек AI из базы данных
export async function getUserAISettings(userId: string): Promise<AISettings | null> {
  try {
    // Здесь должен быть импорт db, но чтобы избежать циклических зависимостей,
    // мы предполагаем, что эта функция будет вызвана в контексте API маршрута
    // где db уже импортирован
    
    // В реальном использовании нужно передавать db как параметр
    // или использовать другой подход для работы с базой данных
    
    return null;
  } catch (error) {
    console.error('Ошибка получения настроек AI:', error);
    return null;
  }
}