import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/users - Получить всех пользователей
export async function GET(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      // Администраторы видят всех пользователей
      // Менеджеры и обычные пользователи видят только участников своих проектов
      let users;
      
      if (user.role === 'ADMIN') {
        users = await db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
      } else {
        // Получаем проекты пользователя
        const userProjects = await db.projectMember.findMany({
          where: { userId: user.id },
          select: { projectId: true },
        });

        const projectIds = userProjects.map(pm => pm.projectId);

        // Получаем всех участников этих проектов
        const projectMembers = await db.projectMember.findMany({
          where: { projectId: { in: projectIds } },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
              },
            },
          },
        });

        // Удаляем дубликаты пользователей
        const uniqueUsers = new Map();
        projectMembers.forEach(member => {
          if (!uniqueUsers.has(member.user.id)) {
            uniqueUsers.set(member.user.id, member.user);
          }
        });

        users = Array.from(uniqueUsers.values());
      }

      return NextResponse.json({ users });
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  });
}