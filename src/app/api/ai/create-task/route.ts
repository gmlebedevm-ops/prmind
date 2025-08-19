import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { generateAIResponse } from '@/lib/ai-providers';

const createTaskSchema = z.object({
  projectId: z.string().min(1, 'ID проекта обязателен'),
  description: z.string().min(1, 'Описание задачи обязательно'),
  chatId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { projectId, description, chatId } = createTaskSchema.parse(body);

      // Проверяем доступ к проекту
      const projectMember = await db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (!projectMember && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Нет доступа к проекту' },
          { status: 403 }
        );
      }

      // Получаем информацию о проекте для контекста
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { title: true, description: true },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 404 }
        );
      }

      // Получаем настройки AI пользователя
      let aiSettings = await db.aISettings.findUnique({
        where: { userId: user.id },
      });

      // Если настроек нет, создаем настройки по умолчанию
      if (!aiSettings) {
        aiSettings = await db.aISettings.create({
          data: {
            userId: user.id,
            provider: 'Z_AI',
            maxTokens: 1000,
            temperature: 0.7,
            enabled: true,
          },
        });
      }

      // Проверяем, включен ли AI
      if (!aiSettings.enabled) {
        return NextResponse.json(
          { error: 'AI-ассистент отключен в настройках' },
          { status: 400 }
        );
      }

      try {
        // Создаем промпт для AI
        const prompt = `Проанализируй запрос пользователя и создай структурированную задачу для проекта.

Проект: ${project.title}
Описание проекта: ${project.description || 'Нет описания'}
Запрос пользователя: ${description}

Пожалуйста, верни ответ в формате JSON со следующей структурой:
{
  "title": "Краткое и понятное название задачи",
  "description": "Подробное описание задачи с требованиями",
  "priority": "LOW, MEDIUM или HIGH",
  "status": "TODO, IN_PROGRESS или REVIEW",
  "dueDate": "Дата в формате YYYY-MM-DD или null",
  "estimatedHours": "Предполагаемое время в часах или null",
  "tags": ["массив", "тегов", "связанных", "с", "задачей"]
}

Важно: Верни только JSON без дополнительного текста.`;

        // Используем новую систему провайдеров
        const aiResponse = await generateAIResponse(aiSettings, [
          {
            role: 'system',
            content: 'Ты - эксперт по управлению проектами. Твоя задача - анализировать запросы пользователей и создавать структурированные задачи.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ]);

        // Парсим JSON ответ
        let taskData;
        try {
          // Извлекаем JSON из ответа (на случай, если AI добавит дополнительный текст)
          const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('Не найден JSON в ответе AI');
          }
          taskData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Ошибка парсинга JSON:', parseError);
          throw new Error('Ошибка обработки ответа AI');
        }

        // Валидация данных от AI
        const validatedTaskData = z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
          status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW']).optional(),
          dueDate: z.string().nullable().optional(),
          estimatedHours: z.number().nullable().optional(),
          tags: z.array(z.string()).optional(),
        }).parse(taskData);

        // Создаем задачу в базе данных
        const task = await db.task.create({
          data: {
            title: validatedTaskData.title,
            description: validatedTaskData.description,
            priority: validatedTaskData.priority || 'MEDIUM',
            status: validatedTaskData.status || 'TODO',
            dueDate: validatedTaskData.dueDate ? new Date(validatedTaskData.dueDate) : null,
            estimatedHours: validatedTaskData.estimatedHours,
            projectId,
            assigneeId: user.id, // Назначаем задачу текущему пользователю
            tags: validatedTaskData.tags || [],
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        // Если указан chatId, добавляем сообщение о созданной задаче
        if (chatId) {
          const aiChat = await db.aIChat.findFirst({
            where: {
              id: chatId,
              userId: user.id,
            },
          });

          if (aiChat) {
            const messages = aiChat.messages as any[];
            messages.push({
              role: 'assistant',
              content: `✅ Задача "${task.title}" успешно создана!\n\n📋 **Описание:** ${task.description}\n🎯 **Приоритет:** ${task.priority}\n📊 **Статус:** ${task.status}\n👤 **Исполнитель:** ${task.assignee.name || task.assignee.email}\n📅 **Срок:** ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'Не указан'}`,
            });

            await db.aIChat.update({
              where: { id: chatId },
              data: { messages },
            });
          }
        }

        return NextResponse.json({
          message: 'Задача успешно создана',
          task,
          provider: aiSettings.provider,
          model: aiResponse.model,
        });
      } catch (aiError) {
        console.error('Ошибка AI:', aiError);
        
        // В случае ошибки AI, создаем базовую задачу
        const task = await db.task.create({
          data: {
            title: `Задача на основе: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
            description,
            priority: 'MEDIUM',
            status: 'TODO',
            projectId,
            assigneeId: user.id,
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return NextResponse.json({
          message: 'Задача создана (базовый вариант)',
          task,
          warning: 'Не удалось обработать запрос с AI, создана базовая задача',
          error: aiError instanceof Error ? aiError.message : 'Неизвестная ошибка',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка создания задачи через AI:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}