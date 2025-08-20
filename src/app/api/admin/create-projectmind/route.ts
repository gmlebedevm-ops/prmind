import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST /api/admin/create-projectmind - Создать проект ProjectMind с задачами из CHECKLIST.md
export async function POST(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      console.log('Начало создания проекта ProjectMind...');
      console.log('Пользователь:', { id: user.id, email: user.email, role: user.role });
      
      // Проверяем, что пользователь является администратором
      if (user.role !== 'ADMIN') {
        console.log('Доступ запрещен. Пользователь не является администратором');
        return NextResponse.json(
          { error: 'Доступ запрещен. Требуются права администратора.' },
          { status: 403 }
        );
      }

      console.log('Пользователь является администратором. Начинаем импорт скрипта...');
      
      // Импортируем и запускаем функцию создания проекта
      const { createProjectMindProject } = await import('@/scripts/create-projectmind-project');
      
      console.log('Скрипт импортирован. Запускаем создание проекта...');
      
      // Запускаем создание проекта
      const result = await createProjectMindProject();
      
      console.log('Проект успешно создан:', result);

      return NextResponse.json({
        message: 'Проект "Разработка ProjectMind" успешно создан со всеми задачами из CHECKLIST.md',
        result
      });

    } catch (error) {
      console.error('Ошибка при создании проекта ProjectMind:', error);
      
      return NextResponse.json(
        { 
          error: 'Внутренняя ошибка сервера',
          details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        },
        { status: 500 }
      );
    }
  });
}