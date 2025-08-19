import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const addTagSchema = z.object({
  tagId: z.string().min(1, 'ID тега обязателен'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/tags - Получить теги проекта
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

      const projectTags = await db.projectTag.findMany({
        where: { projectId },
        include: {
          tag: true,
        },
      });

      const tags = projectTags.map(pt => pt.tag);

      return NextResponse.json({ tags });
    } catch (error) {
      console.error('Ошибка получения тегов проекта:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/projects/[id]/tags - Добавить тег к проекту
export async function POST(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const projectId = params.id;
      const body = await request.json();
      const { tagId } = addTagSchema.parse(body);

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

      // Проверяем, существует ли тег
      const tag = await db.tag.findUnique({
        where: { id: tagId },
      });

      if (!tag) {
        return NextResponse.json(
          { error: 'Тег не найден' },
          { status: 404 }
        );
      }

      // Проверяем, не привязан ли тег уже к проекту
      const existingProjectTag = await db.projectTag.findUnique({
        where: {
          projectId_tagId: {
            projectId,
            tagId,
          },
        },
      });

      if (existingProjectTag) {
        return NextResponse.json(
          { error: 'Тег уже привязан к проекту' },
          { status: 400 }
        );
      }

      const projectTag = await db.projectTag.create({
        data: {
          projectId,
          tagId,
        },
        include: {
          tag: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Тег успешно добавлен к проекту',
          projectTag,
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

      console.error('Ошибка добавления тега к проекту:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}