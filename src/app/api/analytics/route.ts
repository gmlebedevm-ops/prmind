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

    // Определяем, какие проекты пользователь может видеть
    let projectsWhere: any = {};
    if (user.role === 'USER') {
      // Обычный пользователь видит только проекты, в которых он участник
      projectsWhere = {
        members: {
          some: {
            userId: userId
          }
        }
      };
    }
    // Менеджер и администратор видят все проекты

    // Получаем статистику по проектам
    const projectsStats = await db.project.findMany({
      where: projectsWhere,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            members: true
          }
        },
        tasks: {
          select: {
            status: true,
            priority: true,
            assigneeId: true,
            dueDate: true,
            completedAt: true
          }
        }
      }
    });

    // Агрегируем данные
    const analytics = {
      overview: {
        totalProjects: projectsStats.length,
        activeProjects: projectsStats.filter(p => p.status === 'ACTIVE').length,
        completedProjects: projectsStats.filter(p => p.status === 'COMPLETED').length,
        totalTasks: projectsStats.reduce((sum, p) => sum + p._count.tasks, 0),
        completedTasks: projectsStats.reduce((sum, p) => 
          sum + p.tasks.filter(t => t.status === 'DONE').length, 0
        )
      },
      projectsByStatus: {
        PLANNING: projectsStats.filter(p => p.status === 'PLANNING').length,
        ACTIVE: projectsStats.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projectsStats.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projectsStats.filter(p => p.status === 'COMPLETED').length,
        CANCELLED: projectsStats.filter(p => p.status === 'CANCELLED').length
      },
      tasksByStatus: {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
        CANCELLED: 0
      },
      tasksByPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0
      },
      overdueTasks: 0,
      upcomingDeadlines: [] as Array<{
        taskId: string;
        taskTitle: string;
        projectTitle: string;
        dueDate: string;
        daysLeft: number;
      }>,
      userWorkload: [] as Array<{
        userId: string;
        userName: string;
        assignedTasks: number;
        completedTasks: number;
      }>
    };

    // Считаем статистику по задачам
    projectsStats.forEach(project => {
      project.tasks.forEach(task => {
        analytics.tasksByStatus[task.status as keyof typeof analytics.tasksByStatus]++;
        analytics.tasksByPriority[task.priority as keyof typeof analytics.tasksByPriority]++;
        
        // Проверяем просроченные задачи
        if (task.dueDate && task.status !== 'DONE' && task.status !== 'CANCELLED') {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          if (dueDate < now) {
            analytics.overdueTasks++;
          } else if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) {
            // Задачи со сроком в течение 7 дней
            analytics.upcomingDeadlines.push({
              taskId: task.id,
              taskTitle: `Задача из проекта ${project.title}`,
              projectTitle: project.title,
              dueDate: task.dueDate.toISOString(),
              daysLeft: Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            });
          }
        }
      });
    });

    // Сортируем ближайшие дедлайны
    analytics.upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft);
    analytics.upcomingDeadlines = analytics.upcomingDeadlines.slice(0, 10);

    // Получаем статистику по загрузке пользователей (только для менеджеров и админов)
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          assignedTasks: {
            select: {
              status: true
            }
          }
        }
      });

      analytics.userWorkload = users.map(user => ({
        userId: user.id,
        userName: user.name || user.email,
        assignedTasks: user.assignedTasks.length,
        completedTasks: user.assignedTasks.filter(t => t.status === 'DONE').length
      }));
    }

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}