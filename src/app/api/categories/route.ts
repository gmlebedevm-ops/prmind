import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно'),
  color: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').optional(),
  color: z.string().optional(),
});

// GET /api/categories - Получить все категории
export async function GET(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');

      let categories;
      
      if (projectId) {
        // Получаем категории конкретного проекта
        const projectCategories = await db.projectCategory.findMany({
          where: { projectId },
          include: {
            category: true,
          },
        });

        categories = projectCategories.map(pc => pc.category);
      } else {
        // Администраторы видят все категории
        // Остальные видят только категории из своих проектов
        if (user.role === 'ADMIN') {
          categories = await db.category.findMany({
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

          // Получаем категории этих проектов
          const projectCategories = await db.projectCategory.findMany({
            where: { projectId: { in: projectIds } },
            include: {
              category: true,
            },
          });

          // Удаляем дубликаты
          const uniqueCategories = new Map();
          projectCategories.forEach(pc => {
            if (!uniqueCategories.has(pc.category.id)) {
              uniqueCategories.set(pc.category.id, pc.category);
            }
          });

          categories = Array.from(uniqueCategories.values());
        }
      }

      return NextResponse.json({ categories });
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/categories - Создать новую категорию
export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { name, color } = createCategorySchema.parse(body);

      // Проверяем, существует ли категория с таким именем
      const existingCategory = await db.category.findUnique({
        where: { name },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Категория с таким именем уже существует' },
          { status: 400 }
        );
      }

      const category = await db.category.create({
        data: {
          name,
          color: color || '#10B981', // Зеленый цвет по умолчанию
        },
      });

      return NextResponse.json(
        {
          message: 'Категория успешно создана',
          category,
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

      console.error('Ошибка создания категории:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}