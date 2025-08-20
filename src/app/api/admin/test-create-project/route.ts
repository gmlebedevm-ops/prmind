import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/admin/test-create-project - Тестовое создание проекта
export async function POST(request: NextRequest) {
  return await requireAuth(request, async (request: NextRequest, user) => {
    try {
      console.log('Начало тестового создания проекта...');
      console.log('Пользователь:', { id: user.id, email: user.email, role: user.role });
      
      // Проверяем, что пользователь является администратором
      if (user.role !== 'ADMIN') {
        console.log('Доступ запрещен. Пользователь не является администратором');
        return NextResponse.json(
          { error: 'Доступ запрещен. Требуются права администратора.' },
          { status: 403 }
        );
      }

      console.log('Пользователь является администратором. Создаем тестовый проект...');
      
      // Создаем простой тестовый проект
      const project = await db.project.create({
        data: {
          title: 'Тестовый проект',
          description: 'Это тестовый проект для проверки работы системы',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
        },
      });

      console.log(`Проект "${project.title}" создан с ID: ${project.id}`);
      
      // Добавляем пользователя как владелец проекта
      await db.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: 'OWNER',
        },
      });
      
      console.log(`Пользователь ${user.email} добавлен как владелец проекта`);

      // Создаем тестовую задачу
      const task = await db.task.create({
        data: {
          title: 'Тестовая задача',
          description: 'Это тестовая задача для проверки работы системы',
          projectId: project.id,
          priority: 'MEDIUM',
          status: 'TODO',
          creatorId: user.id,
        },
      });
      
      console.log(`Задача "${task.title}" создана с ID: ${task.id}`);

      return NextResponse.json({
        message: 'Тестовый проект успешно создан',
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
        },
        task: {
          id: task.id,
          title: task.title,
        }
      });

    } catch (error) {
      console.error('Ошибка при создании тестового проекта:', error);
      
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