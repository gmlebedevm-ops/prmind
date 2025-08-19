import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/ai/chats - Получить историю чатов пользователя
export async function GET(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');
      const taskId = searchParams.get('taskId');

      const whereClause: any = {
        userId: user.id,
      };

      if (projectId) {
        whereClause.projectId = projectId;
      }

      if (taskId) {
        whereClause.taskId = taskId;
      }

      const chats = await db.aIChat.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 50, // Ограничиваем количество чатов
      });

      return NextResponse.json({ chats });
    } catch (error) {
      console.error('Ошибка получения чатов:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}