import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем информацию о пользователе
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Определяем, какие задачи пользователь может видеть
    let tasksWhere: any = {};
    if (user.role === 'USER') {
      // Обычный пользователь видит только задачи из проектов, в которых он участник
      tasksWhere = {
        project: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      };
    }

    // Получаем задачи с датами
    const tasks = await db.task.findMany({
      where: {
        ...tasksWhere,
        OR: [
          { startDate: { not: null } },
          { dueDate: { not: null } }
        ]
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { dueDate: 'asc' }
      ]
    });

    // Форматируем задачи для календаря
    const calendarEvents = tasks.map(task => {
      const events = [];
      
      // Событие начала задачи
      if (task.startDate) {
        events.push({
          id: `${task.id}-start`,
          taskId: task.id,
          title: `Начало: ${task.title}`,
          start: task.startDate.toISOString().split('T')[0],
          end: task.startDate.toISOString().split('T')[0],
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          type: 'start',
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            project: task.project,
            assignee: task.assignee
          }
        });
      }
      
      // Событие дедлайна
      if (task.dueDate) {
        const isOverdue = task.dueDate < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED';
        events.push({
          id: `${task.id}-due`,
          taskId: task.id,
          title: `Дедлайн: ${task.title}`,
          start: task.dueDate.toISOString().split('T')[0],
          end: task.dueDate.toISOString().split('T')[0],
          backgroundColor: isOverdue ? '#EF4444' : '#F59E0B',
          borderColor: isOverdue ? '#EF4444' : '#F59E0B',
          type: 'due',
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            project: task.project,
            assignee: task.assignee
          }
        });
      }
      
      // Если есть обе даты, создаем событие продолжительности
      if (task.startDate && task.dueDate && task.startDate.toISOString() !== task.dueDate.toISOString()) {
        const isCompleted = task.status === 'DONE';
        events.push({
          id: task.id,
          taskId: task.id,
          title: task.title,
          start: task.startDate.toISOString().split('T')[0],
          end: task.dueDate.toISOString().split('T')[0],
          backgroundColor: isCompleted ? '#10B981' : '#6B7280',
          borderColor: isCompleted ? '#10B981' : '#6B7280',
          type: 'duration',
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            project: task.project,
            assignee: task.assignee
          }
        });
      }
      
      return events;
    }).flat();

    return NextResponse.json({ events: calendarEvents });
  } catch (error) {
    console.error('Ошибка получения задач для календаря:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}