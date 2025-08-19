const fetch = require('node-fetch');

async function createTestUser() {
  try {
    // Регистрация тестового пользователя
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Тестовый Пользователь',
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const registerResult = await registerResponse.json();
    console.log('Регистрация:', registerResult);

    if (registerResponse.ok) {
      // Вход для получения токена
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const loginResult = await loginResponse.json();
      console.log('Вход:', loginResult);
      
      if (loginResponse.ok) {
        console.log('ID пользователя:', loginResult.user.id);
        console.log('Теперь вы можете использовать этот ID для тестирования AI-ассистента');
      }
    }
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

createTestUser();