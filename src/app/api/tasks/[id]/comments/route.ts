import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const taskId = params.id;

    // Проверяем, имеет ли пользователь доступ к этой задаче
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const hasAccess = user.role === 'ADMIN' || 
                     user.role === 'MANAGER' || 
                     task.project.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем комментарии к задаче
    const comments = await db.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Обрабатываем упоминания в комментариях
    const processedComments = comments.map(comment => {
      const content = comment.content;
      const mentions = content.match(/@(\w+)/g) || [];
      
      return {
        ...comment,
        mentions: mentions.map(mention => mention.substring(1)), // Удаляем @
        content: content // Возвращаем оригинальный контент
      };
    });

    return NextResponse.json({ comments: processedComments });
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const taskId = params.id;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Текст комментария не может быть пустым' }, { status: 400 });
    }

    // Проверяем, имеет ли пользователь доступ к этой задаче
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const hasAccess = user.role === 'ADMIN' || 
                     user.role === 'MANAGER' || 
                     task.project.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Находим упомянутых пользователей
    const mentions = content.match(/@(\w+)/g) || [];
    const mentionedUsernames = mentions.map(mention => mention.substring(1));

    // Находим ID упомянутых пользователей в проекте
    const projectMembers = await db.projectMember.findMany({
      where: {
        projectId: task.projectId,
        user: {
          OR: mentionedUsernames.map(username => ({
            name: { contains: username }
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Создаем комментарий
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        taskId: taskId,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Здесь можно добавить логику отправки уведомлений упомянутым пользователям
    // Например, через WebSocket или email

    return NextResponse.json({ 
      comment: {
        ...comment,
        mentions: mentionedUsernames
      }
    });
  } catch (error) {
    console.error('Ошибка создания комментария:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}