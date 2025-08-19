import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { generateAIResponse } from '@/lib/ai-providers';

const chatSchema = z.object({
  message: z.string().min(1, 'Сообщение обязательно'),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  chatId: z.string().optional(),
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { message, projectId, taskId, chatId } = chatSchema.parse(body);

      // Проверяем доступ к проекту/задаче
      if (projectId) {
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
      }

      if (taskId) {
        const task = await db.task.findFirst({
          where: {
            id: taskId,
            project: {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        });

        if (!task) {
          return NextResponse.json(
            { error: 'Задача не найдена или нет доступа' },
            { status: 404 }
          );
        }
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

      // Получаем или создаем чат
      let aiChat;
      let messages: ChatMessage[] = [];

      if (chatId) {
        aiChat = await db.aIChat.findFirst({
          where: {
            id: chatId,
            userId: user.id,
          },
        });

        if (!aiChat) {
          return NextResponse.json(
            { error: 'Чат не найден' },
            { status: 404 }
          );
        }

        messages = aiChat.messages as ChatMessage[];
      } else {
        // Создаем новый чат
        aiChat = await db.aIChat.create({
          data: {
            projectId,
            taskId,
            userId: user.id,
            messages: [],
          },
        });

        messages = [];
      }

      // Добавляем системный промпт с контекстом
      if (messages.length === 0) {
        let systemPrompt = `Ты - AI-ассистент для управления проектами ProjectMind. 
Твоя задача - помогать пользователям с управлением проектами и задачами.
Пользователь: ${user.name || user.email}
Роль: ${user.role}`;

        if (projectId) {
          const project = await db.project.findUnique({
            where: { id: projectId },
            select: { title: true, description: true, status: true },
          });
          if (project) {
            systemPrompt += `\nТекущий проект: ${project.title}`;
            if (project.description) {
              systemPrompt += `\nОписание проекта: ${project.description}`;
            }
            systemPrompt += `\nСтатус проекта: ${project.status}`;
          }
        }

        if (taskId) {
          const task = await db.task.findUnique({
            where: { id: taskId },
            select: { title: true, description: true, status: true, priority: true },
          });
          if (task) {
            systemPrompt += `\nТекущая задача: ${task.title}`;
            if (task.description) {
              systemPrompt += `\nОписание задачи: ${task.description}`;
            }
            systemPrompt += `\nСтатус задачи: ${task.status}`;
            systemPrompt += `\nПриоритет задачи: ${task.priority}`;
          }
        }

        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      // Добавляем сообщение пользователя
      messages.push({
        role: 'user',
        content: message,
      });

      try {
        // Используем новую систему провайдеров
        const aiResponse = await generateAIResponse(aiSettings, messages);

        // Добавляем ответ ассистента
        messages.push({
          role: 'assistant',
          content: aiResponse.content,
        });

        // Обновляем чат в базе данных
        await db.aIChat.update({
          where: { id: aiChat.id },
          data: {
            messages: messages as any,
            title: messages.length === 3 ? message.substring(0, 50) + (message.length > 50 ? '...' : '') : aiChat.title,
          },
        });

        return NextResponse.json({
          message: aiResponse.content,
          chatId: aiChat.id,
          model: aiResponse.model,
          usage: aiResponse.usage,
        });
      } catch (aiError) {
        console.error('Ошибка AI:', aiError);
        
        // В случае ошибки AI, возвращаем запасной ответ
        const fallbackMessage = 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.';
        
        messages.push({
          role: 'assistant',
          content: fallbackMessage,
        });

        await db.aIChat.update({
          where: { id: aiChat.id },
          data: {
            messages: messages as any,
          },
        });

        return NextResponse.json({
          message: fallbackMessage,
          chatId: aiChat.id,
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

      console.error('Ошибка AI-чата:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}