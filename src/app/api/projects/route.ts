import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Название проекта обязательно'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1, 'Название проекта обязательно').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/projects - Получить все проекты пользователя
export async function GET(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      // Получаем проекты, где пользователь является участником
      const projects = await db.project.findMany({
        where: {
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
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      const total = await db.project.count({
        where: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      return NextResponse.json({
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Ошибка получения проектов:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/projects - Создать новый проект
export async function POST(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { title, description, startDate, endDate } = createProjectSchema.parse(body);

      // Создаем проект
      const project = await db.project.create({
        data: {
          title,
          description,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
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
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Проект успешно создан',
          project,
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

      console.error('Ошибка создания проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}