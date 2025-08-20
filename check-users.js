const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Проверка пользователей в базе данных...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    console.log('Найденные пользователи:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    // Проверяем проекты
    const projects = await prisma.project.findMany({
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });
    
    console.log('\nПроекты и их участники:');
    projects.forEach(project => {
      console.log(`Проект: ${project.title} (ID: ${project.id})`);
      project.members.forEach(member => {
        console.log(`  - Участник: ${member.userId}, Роль: ${member.role}`);
      });
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();