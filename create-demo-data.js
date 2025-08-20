const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoData() {
  try {
    console.log('Создание демо-данных...');
    
    // Создаем пользователей
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Администратор',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        name: 'Менеджер',
        password: hashedPassword,
        role: 'MANAGER',
      },
    });
    
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Пользователь',
        password: hashedPassword,
        role: 'USER',
      },
    });
    
    console.log('Пользователи созданы:', { adminUser, managerUser, regularUser });
    
    // Создаем проекты
    const project1 = await prisma.project.create({
      data: {
        title: 'Разработка веб-приложения',
        description: 'Создание современного веб-приложения на Next.js',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        members: {
          create: [
            {
              userId: adminUser.id,
              role: 'OWNER',
            },
            {
              userId: managerUser.id,
              role: 'MANAGER',
            },
            {
              userId: regularUser.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    });
    
    const project2 = await prisma.project.create({
      data: {
        title: 'Мобильное приложение',
        description: 'Разработка мобильного приложения для iOS и Android',
        status: 'PLANNING',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        members: {
          create: [
            {
              userId: managerUser.id,
              role: 'OWNER',
            },
            {
              userId: regularUser.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    });
    
    const project3 = await prisma.project.create({
      data: {
        title: 'AI-ассистент',
        description: 'Интеграция AI-ассистента в систему управления проектами',
        status: 'ACTIVE',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-31'),
        members: {
          create: [
            {
              userId: adminUser.id,
              role: 'OWNER',
            },
            {
              userId: managerUser.id,
              role: 'MANAGER',
            },
          ],
        },
      },
    });
    
    console.log('Проекты созданы:', { project1, project2, project3 });
    
    // Создаем задачи для проектов
    const tasks = [
      {
        title: 'Настройка проекта',
        description: 'Инициализация проекта и настройка окружения',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: adminUser.id,
        creatorId: adminUser.id,
      },
      {
        title: 'Разработка API',
        description: 'Создание RESTful API для приложения',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: managerUser.id,
        creatorId: adminUser.id,
      },
      {
        title: 'Создание UI компонентов',
        description: 'Разработка пользовательского интерфейса',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: regularUser.id,
        creatorId: managerUser.id,
      },
      {
        title: 'Планирование архитектуры',
        description: 'Проектирование архитектуры мобильного приложения',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project2.id,
        assigneeId: managerUser.id,
        creatorId: managerUser.id,
      },
      {
        title: 'Настройка AI-модели',
        description: 'Интеграция и настройка AI-модели',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        projectId: project3.id,
        assigneeId: adminUser.id,
        creatorId: adminUser.id,
      },
    ];
    
    for (const taskData of tasks) {
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          projectId: taskData.projectId,
          assigneeId: taskData.assigneeId,
          creatorId: taskData.creatorId,
        },
      });
      console.log('Задача создана:', task.title);
    }
    
    console.log('Демо-данные успешно созданы!');
    console.log('Тестовые пользователи:');
    console.log('Администратор: admin@example.com / password123');
    console.log('Менеджер: manager@example.com / password123');
    console.log('Пользователь: user@example.com / password123');
    
  } catch (error) {
    console.error('Ошибка создания демо-данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData();