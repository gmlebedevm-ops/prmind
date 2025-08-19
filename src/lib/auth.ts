import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // В реальном приложении здесь нужно извлечь JWT токен из заголовка
    // и проверить его валидность. Для простоты примера используем заголовок X-User-ID
    
    const userId = request.headers.get('X-User-ID');
    
    if (!userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    const result = await handler(request, user);
    return result;
  } catch (error) {
    console.error('Ошибка в requireAuth:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export function requireRole(roles: ('ADMIN' | 'MANAGER' | 'USER')[]) {
  return function (handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
    return requireAuth(async (request: NextRequest, user: AuthUser): Promise<NextResponse> => {
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Недостаточно прав' },
          { status: 403 }
        );
      }

      return handler(request, user);
    });
  };
}