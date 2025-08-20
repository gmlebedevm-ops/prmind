import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

export async function getAuthUser(headers: Headers | null): Promise<AuthUser | null> {
  try {
    // Проверяем заголовок в разных регистрах
    let userId = headers?.get('X-User-ID') || headers?.get('x-user-id') || headers?.get('x-User-ID');
    console.log('Auth check - userId from header:', userId);
    
    if (!userId) {
      console.log('No userId found in headers');
      // Выводим все заголовки для отладки
      if (headers) {
        console.log('Available headers:');
        headers.forEach((value, key) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      return null;
    }

    // Проверяем пользователя в базе данных
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('User found in database:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', { id: user.id, email: user.email, role: user.role });
    }

    return user;
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request.headers);
    
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