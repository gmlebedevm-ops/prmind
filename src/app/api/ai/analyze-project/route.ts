import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import ZAI from 'z-ai-web-dev-sdk';

const analyzeProjectSchema = z.object({
  projectId: z.string().min(1, 'ID проекта обязателен'),
});

interface ProjectAnalysis {
  progress: number;
  status: string;
  risks: Array<{
    level: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  timeline: {
    estimatedCompletion: string;
    delays: Array<{
      task: string;
      delay: number;
      reason: string;
    }>;
  };
  team: {
    productivity: number;
    workload: Array<{
      member: string;
      tasks: number;
      workload: 'low' | 'medium' | 'high';
    }>;
  };
}

export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { projectId } = analyzeProjectSchema.parse(body);

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

      // Получаем данные проекта
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              timeLogs: {
                select: {
                  hours: true,
                  date: true,
                },
              },
              _count: {
                select: {
                  subtasks: true,
                  comments: true,
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 404 }
        );
      }

      try {
        // Инициализируем ZAI SDK
        const zai = await ZAI.create();

        // Подготавливаем данные для анализа
        const projectData = {
          title: project.title,
          description: project.description || '',
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          createdAt: project.createdAt,
          tasks: project.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            startDate: task.startDate,
            completedAt: task.completedAt,
            assignee: task.assignee?.name || 'Не назначен',
            timeSpent: task.timeLogs.reduce((sum, log) => sum + log.hours, 0),
            subtasksCount: task._count.subtasks,
            commentsCount: task._count.comments,
          })),
          members: project.members.map(member => ({
            name: member.user.name || member.user.email,
            role: member.role,
            tasksAssigned: project.tasks.filter(t => t.assigneeId === member.userId).length,
            tasksCreated: project.tasks.filter(t => t.creatorId === member.userId).length,
          })),
        };

        // Создаем промпт для анализа проекта
        const prompt = `Проанализируй данные проекта и предоставь детальный анализ его текущего состояния, рисков и рекомендаций.

Данные проекта:
${JSON.stringify(projectData, null, 2)}

Требуется предоставить анализ в формате JSON:
{
  "progress": "Процент выполнения проекта (0-100)",
  "status": "Общая оценка состояния проекта (excellent, good, average, poor, critical)",
  "risks": [
    {
      "level": "low, medium или high",
      "description": "Описание риска",
      "recommendation": "Рекомендация по mitigации риска"
    }
  ],
  "recommendations": [
    {
      "category": "Категория рекомендации (planning, execution, team, resources, communication)",
      "title": "Краткое название рекомендации",
      "description": "Развернутое описание",
      "priority": "low, medium или high"
    }
  ],
  "timeline": {
    "estimatedCompletion": "Предполагаемая дата завершения (YYYY-MM-DD)",
    "delays": [
      {
        "task": "Название задачи",
        "delay": "Задержка в днях",
        "reason": "Причина задержки"
      }
    ]
  },
  "team": {
    "productivity": "Оценка продуктивности команды (0-100)",
    "workload": [
      {
        "member": "Имя участника",
        "tasks": "Количество задач",
        "workload": "low, medium или high"
      }
    ]
  }
}

Учитывай:
- Текущую дату: ${new Date().toISOString().split('T')[0]}
- Статусы задач: TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED
- Приоритеты: LOW, MEDIUM, HIGH, URGENT
- Роли участников: OWNER, MANAGER, MEMBER

Будь объективен и предоставь практические рекомендации. Верни только JSON без дополнительного текста.`;

        // Отправляем запрос к AI
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Ты - эксперт по управлению проектами с многолетним опытом. Твоя задача анализировать данные проектов и предоставлять детальные, практические рекомендации.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 2000,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
          throw new Error('Не получен ответ от AI');
        }

        // Парсим JSON ответ от AI
        let analysis: ProjectAnalysis;
        try {
          // Извлекаем JSON из ответа
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('JSON не найден в ответе');
          }
          analysis = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Ошибка парсинга JSON:', parseError);
          throw new Error('Не удалось обработать ответ от AI');
        }

        return NextResponse.json({
          success: true,
          analysis,
          projectData: {
            title: project.title,
            tasksCount: project.tasks.length,
            completedTasks: project.tasks.filter(t => t.status === 'DONE').length,
            membersCount: project.members.length,
          },
        });
      } catch (aiError) {
        console.error('Ошибка AI при анализе проекта:', aiError);
        
        // В случае ошибки AI, возвращаем базовый анализ
        const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
        const totalTasks = project.tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const fallbackAnalysis: ProjectAnalysis = {
          progress,
          status: progress > 75 ? 'good' : progress > 50 ? 'average' : 'poor',
          risks: [
            {
              level: 'medium',
              description: 'AI-анализ временно недоступен',
              recommendation: 'Попробуйте выполнить анализ позже',
            },
          ],
          recommendations: [
            {
              category: 'planning',
              title: 'Продолжайте работу над проектом',
              description: 'Фокусируйтесь на завершении текущих задач',
              priority: 'medium',
            },
          ],
          timeline: {
            estimatedCompletion: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            delays: [],
          },
          team: {
            productivity: 70,
            workload: project.members.map(member => ({
              member: member.user.name || member.user.email,
              tasks: project.tasks.filter(t => t.assigneeId === member.userId).length,
              workload: 'medium',
            })),
          },
        };

        return NextResponse.json({
          success: true,
          analysis: fallbackAnalysis,
          warning: 'Анализ выполнен без AI из-за временной ошибки',
          projectData: {
            title: project.title,
            tasksCount: project.tasks.length,
            completedTasks,
            membersCount: project.members.length,
          },
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка анализа проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}