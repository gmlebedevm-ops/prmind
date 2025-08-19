import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const addCategorySchema = z.object({
  categoryId: z.string().min(1, 'ID категории обязателен'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/categories - Получить категории проекта
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;

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

      const projectCategories = await db.projectCategory.findMany({
        where: { projectId },
        include: {
          category: true,
        },
      });

      const categories = projectCategories.map(pc => pc.category);

      return NextResponse.json({ categories });
    } catch (error) {
      console.error('Ошибка получения категорий проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/projects/[id]/categories - Добавить категорию к проекту
export async function POST(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;
      const body = await request.json();
      const { categoryId } = addCategorySchema.parse(body);

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

      // Проверяем, существует ли категория
      const category = await db.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Категория не найдена' },
          { status: 404 }
        );
      }

      // Проверяем, не привязана ли категория уже к проекту
      const existingProjectCategory = await db.projectCategory.findUnique({
        where: {
          projectId_categoryId: {
            projectId,
            categoryId,
          },
        },
      });

      if (existingProjectCategory) {
        return NextResponse.json(
          { error: 'Категория уже привязана к проекту' },
          { status: 400 }
        );
      }

      const projectCategory = await db.projectCategory.create({
        data: {
          projectId,
          categoryId,
        },
        include: {
          category: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Категория успешно добавлена к проекту',
          projectCategory,
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

      console.error('Ошибка добавления категории к проекту:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}