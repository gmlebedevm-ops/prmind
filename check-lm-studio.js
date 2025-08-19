async function checkLMStudio() {
  const urls = [
    'http://192.168.2.5:11234',
    'http://192.168.2.5:11234/v1'
  ];
  console.log('=== Проверка доступности LM Studio ===\n');
  
  for (const url of urls) {
    console.log(`Проверка: ${url}`);
    
    try {
      // Проверка базового URL
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      console.log(`  ✅ Доступен, статус: ${response.status}`);
      
      // Проверка моделей
      const modelsUrl = url.endsWith('/v1') ? `${url}/models` : `${url}/v1/models`;
      console.log(`  Проверка моделей: ${modelsUrl}`);
      
      try {
        const modelsResponse = await fetch(modelsUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          console.log('  ✅ Модели доступны:', JSON.stringify(modelsData, null, 2));
        } else {
          console.log(`  ❌ Модели недоступны, статус: ${modelsResponse.status}`);
        }
      } catch (modelsError) {
        console.log(`  ❌ Ошибка при проверке моделей: ${modelsError.message}`);
      }
      
      // Проверка health endpoint
      const healthUrl = url.endsWith('/v1') ? `${url}/health` : `${url}/health`;
      console.log(`  Проверка health: ${healthUrl}`);
      
      try {
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (healthResponse.ok) {
          console.log('  ✅ Health check успешен');
        } else {
          console.log(`  ⚠️  Health check статус: ${healthResponse.status}`);
        }
      } catch (healthError) {
        console.log(`  ❌ Ошибка health check: ${healthError.message}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Недоступен: ${error.message}`);
    }
    
    console.log(''); // Пустая строка для разделения
  }
}

checkLMStudio();