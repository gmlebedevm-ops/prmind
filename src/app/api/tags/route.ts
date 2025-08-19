import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1, 'Название тега обязательно'),
  color: z.string().optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1, 'Название тега обязательно').optional(),
  color: z.string().optional(),
});

// GET /api/tags - Получить все теги
export async function GET(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');

      let tags;
      
      if (projectId) {
        // Получаем теги конкретного проекта
        const projectTags = await db.projectTag.findMany({
          where: { projectId },
          include: {
            tag: true,
          },
        });

        tags = projectTags.map(pt => pt.tag);
      } else {
        // Администраторы видят все теги
        // Остальные видят только теги из своих проектов
        if (user.role === 'ADMIN') {
          tags = await db.tag.findMany({
            orderBy: {
              name: 'asc',
            },
          });
        } else {
          // Получаем проекты пользователя
          const userProjects = await db.projectMember.findMany({
            where: { userId: user.id },
            select: { projectId: true },
          });

          const projectIds = userProjects.map(pm => pm.projectId);

          // Получаем теги этих проектов
          const projectTags = await db.projectTag.findMany({
            where: { projectId: { in: projectIds } },
            include: {
              tag: true,
            },
          });

          // Удаляем дубликаты
          const uniqueTags = new Map();
          projectTags.forEach(pt => {
            if (!uniqueTags.has(pt.tag.id)) {
              uniqueTags.set(pt.tag.id, pt.tag);
            }
          });

          tags = Array.from(uniqueTags.values());
        }
      }

      return NextResponse.json({ tags });
    } catch (error) {
      console.error('Ошибка получения тегов:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/tags - Создать новый тег
export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { name, color } = createTagSchema.parse(body);

      // Проверяем, существует ли тег с таким именем
      const existingTag = await db.tag.findUnique({
        where: { name },
      });

      if (existingTag) {
        return NextResponse.json(
          { error: 'Тег с таким именем уже существует' },
          { status: 400 }
        );
      }

      const tag = await db.tag.create({
        data: {
          name,
          color: color || '#3B82F6', // Синий цвет по умолчанию
        },
      });

      return NextResponse.json(
        {
          message: 'Тег успешно создан',
          tag,
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

      console.error('Ошибка создания тега:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}