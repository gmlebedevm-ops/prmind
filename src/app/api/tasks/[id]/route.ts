import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tasks/[id] - Получить задачу по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const taskId = params.id;

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
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
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
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          timeLogs: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
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

      return NextResponse.json({ task });
    } catch (error) {
      console.error('Ошибка получения задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// PATCH /api/tasks/[id] - Обновить задачу (частичное обновление)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const taskId = params.id;
      const body = await request.json();
      const {
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        startDate,
      } = updateTaskSchema.parse(body);

      // Проверяем, что пользователь имеет доступ к задаче
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

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) {
        updateData.status = status;
        // Если задача завершена, устанавливаем дату завершения
        if (status === 'DONE') {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
      }
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;

      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: updateData,
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

      return NextResponse.json({
        message: 'Задача успешно обновлена',
        task: updatedTask,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка обновления задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/tasks/[id] - Обновить задачу
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const taskId = params.id;
      const body = await request.json();
      const {
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        startDate,
      } = updateTaskSchema.parse(body);

      // Проверяем, что пользователь имеет доступ к задаче
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

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) {
        updateData.status = status;
        // Если задача завершена, устанавливаем дату завершения
        if (status === 'DONE') {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
      }
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;

      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: updateData,
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

      return NextResponse.json({
        message: 'Задача успешно обновлена',
        task: updatedTask,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка обновления задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/tasks/[id] - Удалить задачу
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const taskId = params.id;

      // Проверяем, что пользователь имеет доступ к задаче
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
        include: {
          project: {
            include: {
              members: {
                where: {
                  userId: user.id,
                },
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

      // Проверяем права на удаление
      const userRole = task.project.members[0]?.role;
      const canDelete = 
        user.role === 'ADMIN' ||
        userRole === 'OWNER' ||
        userRole === 'MANAGER' ||
        task.creatorId === user.id;

      if (!canDelete) {
        return NextResponse.json(
          { error: 'Недостаточно прав для удаления задачи' },
          { status: 403 }
        );
      }

      await db.task.delete({
        where: { id: taskId },
      });

      return NextResponse.json({
        message: 'Задача успешно удалена',
      });
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}