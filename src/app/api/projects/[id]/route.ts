import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateProjectSchema = z.object({
  title: z.string().min(1, 'Название проекта обязательно').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id] - Получить проект по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;

      const project = await db.project.findFirst({
        where: {
          id: projectId,
          members: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
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
                },
              },
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден или нет доступа' },
          { status: 404 }
        );
      }

      return NextResponse.json({ project });
    } catch (error) {
      console.error('Ошибка получения проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/projects/[id] - Обновить проект
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;
      const body = await request.json();
      const { title, description, status, startDate, endDate } = updateProjectSchema.parse(body);

      // Проверяем, что пользователь имеет право редактировать проект
      const projectMember = await db.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
          role: {
            in: ['OWNER', 'MANAGER'],
          },
        },
      });

      if (!projectMember && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Недостаточно прав для редактирования проекта' },
          { status: 403 }
        );
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

      const project = await db.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
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

      return NextResponse.json({
        message: 'Проект успешно обновлен',
        project,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Ошибка обновления проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/projects/[id] - Удалить проект
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;

      // Проверяем, что пользователь имеет право удалить проект
      const projectMember = await db.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
          role: 'OWNER',
        },
      });

      if (!projectMember && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Недостаточно прав для удаления проекта' },
          { status: 403 }
        );
      }

      await db.project.delete({
        where: { id: projectId },
      });

      return NextResponse.json({
        message: 'Проект успешно удален',
      });
    } catch (error) {
      console.error('Ошибка удаления проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}