const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Проверяем, есть ли пользователи в базе
    const users = await prisma.user.findMany();
    console.log('Пользователи в базе данных:', users.length);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });

    // Проверяем настройки AI для каждого пользователя
    for (const user of users) {
      const aiSettings = await prisma.aISettings.findUnique({
        where: { userId: user.id }
      });
      console.log(`Настройки AI для пользователя ${user.email}:`, aiSettings);
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();