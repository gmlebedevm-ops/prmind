import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const settingsSchema = z.object({
  provider: z.enum(['Z_AI', 'LM_STUDIO', 'OPENAI', 'ANTHROPIC', 'CUSTOM']).optional(),
  baseUrl: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  model: z.string().min(1, 'Название модели обязательно').optional(),
  apiKey: z.string().optional(),
  maxTokens: z.number().min(1, 'Минимальное количество токенов - 1').max(8000, 'Максимальное количество токенов - 8000').optional(),
  temperature: z.number().min(0, 'Температура не может быть отрицательной').max(2, 'Температура не может превышать 2').optional(),
  enabled: z.boolean().optional(),
});

// GET /api/ai/settings - Получить настройки AI для пользователя
export async function GET(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      let settings = await db.aISettings.findUnique({
        where: { userId: user.id },
      });

      // Если настроек нет, создаем настройки по умолчанию
      if (!settings) {
        settings = await db.aISettings.create({
          data: {
            userId: user.id,
            provider: 'Z_AI',
            maxTokens: 1000,
            temperature: 0.7,
            enabled: true,
          },
        });
      }

      return NextResponse.json({ settings });
    } catch (error) {
      console.error('Ошибка получения настроек AI:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/ai/settings - Обновить настройки AI
export async function PUT(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const validatedData = settingsSchema.parse(body);

      // Проверяем, что baseUrl указан для LM Studio и CUSTOM
      if ((validatedData.provider === 'LM_STUDIO' || validatedData.provider === 'CUSTOM') && !validatedData.baseUrl) {
        return NextResponse.json(
          { error: 'Базовый URL обязателен для LM Studio и кастомных провайдеров' },
          { status: 400 }
        );
      }

      // Проверяем, что apiKey указан для облачных провайдеров
      if ((validatedData.provider === 'OPENAI' || validatedData.provider === 'ANTHROPIC') && !validatedData.apiKey) {
        return NextResponse.json(
          { error: 'API ключ обязателен для выбранных провайдеров' },
          { status: 400 }
        );
      }

      // Обновляем или создаем настройки
      const settings = await db.aISettings.upsert({
        where: { userId: user.id },
        update: validatedData,
        create: {
          userId: user.id,
          ...validatedData,
          provider: validatedData.provider || 'Z_AI',
          maxTokens: validatedData.maxTokens || 1000,
          temperature: validatedData.temperature || 0.7,
          enabled: validatedData.enabled !== undefined ? validatedData.enabled : true,
        },
      });

      return NextResponse.json({
        message: 'Настройки успешно обновлены',
        settings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка обновления настроек AI:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}