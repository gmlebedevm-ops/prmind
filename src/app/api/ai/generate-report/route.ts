import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import ZAI from 'z-ai-web-dev-sdk';

const generateReportSchema = z.object({
  projectId: z.string().optional(),
  reportType: z.enum(['progress', 'team', 'timeline', 'risks', 'comprehensive']).default('comprehensive'),
  timeRange: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

interface GeneratedReport {
  title: string;
  summary: string;
  generatedAt: string;
  period: string;
  sections: Array<{
    title: string;
    content: string;
    data?: any;
    insights: string[];
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
  }>;
  metrics: {
    [key: string]: number | string;
  };
}

export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { projectId, reportType, timeRange } = generateReportSchema.parse(body);

      // Если указан проект, проверяем доступ
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

      // Определяем период для отчета
      const now = new Date();
      const periodStart = new Date();
      switch (timeRange) {
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          periodStart.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Собираем данные для отчета
      let reportData: any = {};

      if (projectId) {
        // Данные по конкретному проекту
        const project = await db.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: {
              where: {
                createdAt: {
                  gte: periodStart,
                },
              },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                timeLogs: {
                  where: {
                    date: {
                      gte: periodStart,
                    },
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

        reportData = {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
          },
          tasks: project.tasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
            dueDate: task.dueDate,
            assignee: task.assignee?.name || 'Не назначен',
            timeSpent: task.timeLogs.reduce((sum, log) => sum + log.hours, 0),
          })),
          members: project.members.map(member => ({
            id: member.user.id,
            name: member.user.name || member.user.email,
            role: member.role,
          })),
          period: {
            start: periodStart,
            end: now,
            range: timeRange,
          },
        };
      } else {
        // Общие данные по всем проектам пользователя
        const projects = await db.project.findMany({
          where: {
            OR: [
              {
                members: {
                  some: {
                    userId: user.id,
                  },
                },
              },
              {
                creatorId: user.id,
              },
            ],
          },
          include: {
            tasks: {
              where: {
                createdAt: {
                  gte: periodStart,
                },
              },
              include: {
                timeLogs: {
                  where: {
                    date: {
                      gte: periodStart,
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                tasks: true,
                members: true,
              },
            },
          },
        });

        reportData = {
          projects: projects.map(project => ({
            id: project.id,
            title: project.title,
            status: project.status,
            tasksCount: project._count.tasks,
            membersCount: project._count.members,
            completedTasks: project.tasks.filter(t => t.status === 'DONE').length,
            timeSpent: project.tasks.reduce((sum, task) => 
              sum + task.timeLogs.reduce((taskSum, log) => taskSum + log.hours, 0), 0),
          })),
          period: {
            start: periodStart,
            end: now,
            range: timeRange,
          },
        };
      }

      try {
        // Инициализируем ZAI SDK
        const zai = await ZAI.create();

        // Создаем промпт для генерации отчета
        const prompt = `Сгенерируй детальный ${reportType === 'comprehensive' ? 'комплексный' : reportType} отчет за ${timeRange === 'week' ? 'неделю' : timeRange === 'month' ? 'месяц' : timeRange === 'quarter' ? 'квартал' : 'год'}.

Данные для отчета:
${JSON.stringify(reportData, null, 2)}

Текущая дата: ${now.toISOString().split('T')[0]}
Пользователь: ${user.name || user.email}
Роль: ${user.role}

Сгенерируй отчет в формате JSON:
{
  "title": "Заголовок отчета",
  "summary": "Краткое резюме отчета (2-3 предложения)",
  "generatedAt": "${now.toISOString()}",
  "period": "${timeRange}",
  "sections": [
    {
      "title": "Заголовок раздела",
      "content": "Содержание раздела",
      "data": {
        "Дополнительные данные для этого раздела (опционально)"
      },
      "insights": [
        "Ключевые инсайты из этого раздела"
      ]
    }
  ],
  "recommendations": [
    {
      "priority": "low, medium или high",
      "category": "Категория рекомендации",
      "description": "Описание рекомендации"
    }
  ],
  "metrics": {
    "Ключевые метрики в виде пар ключ-значение"
  }
}

Для ${reportType} отчета сосредоточься на:
${reportType === 'progress' ? '- Прогрессе выполнения задач и проектов, статистике завершения' : ''}
${reportType === 'team' ? '- Анализе командной работы, распределении задач, продуктивности' : ''}
${reportType === 'timeline' ? '- Анализе сроков выполнения, задержек, планирования' : ''}
${reportType === 'risks' ? '- Выявлении и анализе рисков, проблемных областей' : ''}
${reportType === 'comprehensive' ? '- Комплексном анализе всех аспектов проекта/проектов' : ''}

Будь конкретен, используй факты из предоставленных данных. Верни только JSON без дополнительного текста.`;

        // Отправляем запрос к AI
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Ты - эксперт по анализу данных и составлению отчетов в управлении проектами. Твоя задача создавать структурированные, информативные отчеты на основе предоставленных данных.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 2500,
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
          throw new Error('Не получен ответ от AI');
        }

        // Парсим JSON ответ от AI
        let report: GeneratedReport;
        try {
          // Извлекаем JSON из ответа
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('JSON не найден в ответе');
          }
          report = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Ошибка парсинга JSON:', parseError);
          throw new Error('Не удалось обработать ответ от AI');
        }

        return NextResponse.json({
          success: true,
          report,
          metadata: {
            type: reportType,
            period: timeRange,
            projectId: projectId,
            generatedAt: now.toISOString(),
          },
        });
      } catch (aiError) {
        console.error('Ошибка AI при генерации отчета:', aiError);
        
        // В случае ошибки AI, создаем базовый отчет
        const fallbackReport: GeneratedReport = {
          title: `Отчет за ${timeRange}`,
          summary: 'AI-генерация отчета временно недоступна',
          generatedAt: now.toISOString(),
          period: timeRange,
          sections: [
            {
              title: 'Общая информация',
              content: 'Отчет сгенерирован в базовом режиме без AI-анализа',
              insights: ['Рекомендуется повторить генерацию позже'],
            },
          ],
          recommendations: [
            {
              priority: 'medium',
              category: 'технические проблемы',
              description: 'Попробуйте сгенерировать отчет позже',
            },
          ],
          metrics: {
            status: 'limited',
          },
        };

        return NextResponse.json({
          success: true,
          report: fallbackReport,
          warning: 'Отчет сгенерирован без AI-анализа из-за временной ошибки',
          metadata: {
            type: reportType,
            period: timeRange,
            projectId: projectId,
            generatedAt: now.toISOString(),
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

      console.error('Ошибка генерации отчета:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}