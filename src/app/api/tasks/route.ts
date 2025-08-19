import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно'),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  parentTaskId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

// GET /api/tasks - Получить задачи пользователя
export async function GET(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');
      const status = searchParams.get('status');
      const assigneeId = searchParams.get('assigneeId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      const whereClause: any = {};

      // Фильтрация по проекту (пользователь должен быть участником проекта)
      if (projectId) {
        whereClause.projectId = projectId;
        whereClause.project = {
          members: {
            some: {
              userId: user.id,
            },
          },
        };
      } else {
        // Если проект не указан, показываем задачи из всех проектов пользователя
        whereClause.project = {
          members: {
            some: {
              userId: user.id,
            },
          },
        };
      }

      // Фильтрация по статусу
      if (status) {
        whereClause.status = status;
      }

      // Фильтрация по исполнителю
      if (assigneeId) {
        whereClause.assigneeId = assigneeId;
      }

      // Обычные пользователи видят только свои задачи или назначенные им
      if (user.role === 'USER') {
        whereClause.OR = [
          { assigneeId: user.id },
          { creatorId: user.id },
        ];
      }

      const tasks = await db.task.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
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
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      });

      const total = await db.task.count({ where: whereClause });

      return NextResponse.json({
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Ошибка получения задач:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/tasks - Создать новую задачу
export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const {
        title,
        description,
        projectId,
        assigneeId,
        priority,
        dueDate,
        startDate,
        parentTaskId,
      } = createTaskSchema.parse(body);

      // Проверяем, что пользователь имеет доступ к проекту
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

      // Если указана родительская задача, проверяем её существование
      if (parentTaskId) {
        const parentTask = await db.task.findUnique({
          where: { id: parentTaskId },
        });

        if (!parentTask || parentTask.projectId !== projectId) {
          return NextResponse.json(
            { error: 'Родительская задача не найдена или не принадлежит проекту' },
            { status: 400 }
          );
        }
      }

      const task = await db.task.create({
        data: {
          title,
          description,
          projectId,
          assigneeId,
          creatorId: user.id,
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          parentTaskId,
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
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
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Задача успешно создана',
          task,
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка создания задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}