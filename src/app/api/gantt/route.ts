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

    // Получаем проекты с задачами для Гант-диаграммы
    const projects = await db.project.findMany({
      where: projectsWhere,
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                dueDate: true,
                completedAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Форматируем данные для Гант-диаграммы
    const ganttData = projects.map(project => {
      const projectTasks = project.tasks.map(task => {
        const startDate = task.startDate || project.startDate;
        const dueDate = task.dueDate || project.endDate;
        
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          type: 'task',
          projectId: project.id,
          projectName: project.title,
          status: task.status,
          priority: task.priority,
          startDate: startDate?.toISOString(),
          endDate: dueDate?.toISOString(),
          completedAt: task.completedAt?.toISOString(),
          assignee: task.assignee,
          progress: task.status === 'DONE' ? 100 : 
                   task.status === 'REVIEW' ? 75 :
                   task.status === 'IN_PROGRESS' ? 50 : 0,
          subtasks: task.subtasks.map(subtask => ({
            id: subtask.id,
            title: subtask.title,
            type: 'subtask',
            status: subtask.status,
            startDate: subtask.startDate?.toISOString(),
            endDate: subtask.dueDate?.toISOString(),
            completedAt: subtask.completedAt?.toISOString(),
            progress: subtask.status === 'DONE' ? 100 : 
                     subtask.status === 'REVIEW' ? 75 :
                     subtask.status === 'IN_PROGRESS' ? 50 : 0
          }))
        };
      });

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        type: 'project',
        status: project.status,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        progress: project.status === 'COMPLETED' ? 100 :
                 project.status === 'ACTIVE' ? 75 :
                 project.status === 'ON_HOLD' ? 25 : 0,
        tasks: projectTasks,
        members: project.members.map(member => ({
          id: member.user.id,
          name: member.user.name || member.user.email,
          role: member.role
        }))
      };
    });

    return NextResponse.json({ projects: ganttData });
  } catch (error) {
    console.error('Ошибка получения данных для Гант-диаграммы:', { error });
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}