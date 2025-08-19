import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/ai/chats/[id] - Получить конкретный чат
export async function GET(request: NextRequest, { params }: RouteParams) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const chatId = params.id;

      const chat = await db.aIChat.findFirst({
        where: {
          id: chatId,
          userId: user.id,
        },
      });

      if (!chat) {
        return NextResponse.json(
          { error: 'Чат не найден' },
          { status: 404 }
        );
      }

      return NextResponse.json({ chat });
    } catch (error) {
      console.error('Ошибка получения чата:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/ai/chats/[id] - Удалить чат
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      const chatId = params.id;

      const chat = await db.aIChat.findFirst({
        where: {
          id: chatId,
          userId: user.id,
        },
      });

      if (!chat) {
        return NextResponse.json(
          { error: 'Чат не найден' },
          { status: 404 }
        );
      }

      await db.aIChat.delete({
        where: { id: chatId },
      });

      return NextResponse.json({
        message: 'Чат успешно удален',
      });
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}