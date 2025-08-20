import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      // Получаем настройки AI пользователя
      const aiSettings = await db.aISettings.findUnique({
        where: { userId: user.id },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        aiSettings: aiSettings,
        message: aiSettings ? 'Настройки найдены' : 'Настройки не найдены, будут созданы по умолчанию',
      });
    } catch (error) {
      console.error('Ошибка в debug endpoint:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}