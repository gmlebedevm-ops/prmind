const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Тестирование входа в систему...');
    
    // Тест входа для администратора
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    console.log('Login response status:', loginResponse.status);
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (loginResponse.ok) {
      console.log('✅ Вход успешен');
      console.log('ID пользователя:', loginResult.user.id);
      
      // Тест получения информации о пользователе
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'X-User-ID': loginResult.user.id,
        },
      });
      
      console.log('Me response status:', meResponse.status);
      const meResult = await meResponse.json();
      console.log('Me result:', meResult);
      
      // Тест получения проектов
      const projectsResponse = await fetch('http://localhost:3000/api/projects', {
        headers: {
          'X-User-ID': loginResult.user.id,
        },
      });
      
      console.log('Projects response status:', projectsResponse.status);
      const projectsResult = await projectsResponse.json();
      console.log('Projects result:', projectsResult);
      
      // Тест получения конкретного проекта
      if (projectsResult.projects && projectsResult.projects.length > 0) {
        const projectId = projectsResult.projects[0].id;
        console.log('Testing project access for project ID:', projectId);
        
        const projectResponse = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
          headers: {
            'X-User-ID': loginResult.user.id,
          },
        });
        
        console.log('Project response status:', projectResponse.status);
        const projectResult = await projectResponse.json();
        console.log('Project result:', projectResult);
      }
    } else {
      console.log('❌ Ошибка входа:', loginResult.error);
    }
  } catch (error) {
    console.error('Ошибка тестирования:', error);
  }
}

testLogin();