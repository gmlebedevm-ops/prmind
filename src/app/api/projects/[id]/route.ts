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
  params: Promise<{
    id: string;
  }>;
}

// GET /api/projects/[id] - Получить проект по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  console.log('GET /api/projects/[id] called');
  console.log('Raw headers from request:', Object.fromEntries(request.headers.entries()));
  
  // Проверяем заголовки напрямую
  const userIdFromRequest = request.headers.get('X-User-ID') || request.headers.get('x-user-id');
  console.log('User ID extracted from request headers:', userIdFromRequest);
  
  // Также проверяем query параметры как запасной вариант
  const { searchParams } = new URL(request.url);
  const userIdFromQuery = searchParams.get('userId');
  console.log('User ID from query params:', userIdFromQuery);
  
  console.log('Params from route:', params);
  
  // Если нашли userId в query параметрах, добавляем его в заголовки
  if (userIdFromQuery && !userIdFromRequest) {
    request.headers.set('X-User-ID', userIdFromQuery);
    console.log('Set X-User-ID header from query param:', userIdFromQuery);
  }
  
  return requireAuth(request, async (request: NextRequest, user) => {
    console.log('User authenticated:', user);
    
    try {
      const { id: projectId } = await params;
      console.log('Fetching project with ID:', projectId);

      // Проверяем, что пользователь имеет доступ к проекту
      const projectMember = await db.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
        },
      });

      console.log('Project membership check:', projectMember);

      if (!projectMember && user.role !== 'ADMIN') {
        console.log('Access denied for user:', user.id);
        return NextResponse.json(
          { error: 'Доступ к проекту запрещен' },
          { status: 403 }
        );
      }

      const project = await db.project.findUnique({
        where: { id: projectId },
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
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      console.log('Project found:', project ? 'Yes' : 'No');

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
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
  return requireAuth(request, async (request: NextRequest, user) => {
    try {
      const { id: projectId } = await params;
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
          { error: 'Ошибка валидации', details: error.issues },
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
  return requireAuth(request, async (request: NextRequest, user) => {
    try {
      const { id: projectId } = await params;

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