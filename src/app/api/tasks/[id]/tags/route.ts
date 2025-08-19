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

// GET /api/tasks/[id]/tags - Получить теги задачи
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      });

      if (!task) {
        return NextResponse.json(
          { error: 'Задача не найдена или нет доступа' },
          { status: 404 }
        );
      }

      const taskTags = await db.taskTag.findMany({
        where: { taskId },
        include: {
          tag: true,
        },
      });

      const tags = taskTags.map(tt => tt.tag);

      return NextResponse.json({ tags });
    } catch (error) {
      console.error('Ошибка получения тегов задачи:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// POST /api/tasks/[id]/tags - Добавить тег к задаче
export async function POST(request: NextRequest, { params }: RouteParams) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const taskId = params.id;
      const body = await request.json();
      const { tagId } = addTagSchema.parse(body);

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

      // Проверяем, не привязан ли тег уже к задаче
      const existingTaskTag = await db.taskTag.findUnique({
        where: {
          taskId_tagId: {
            taskId,
            tagId,
          },
        },
      });

      if (existingTaskTag) {
        return NextResponse.json(
          { error: 'Тег уже привязан к задаче' },
          { status: 400 }
        );
      }

      const taskTag = await db.taskTag.create({
        data: {
          taskId,
          tagId,
        },
        include: {
          tag: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Тег успешно добавлен к задаче',
          taskTag,
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

      console.error('Ошибка добавления тега к задаче:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}