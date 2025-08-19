#!/usr/bin/env node

/**
 * Улучшенный скрипт для диагностики подключения к LM Studio
 * 
 * Использование:
 * node check-lm-studio-advanced.js [url]
 * 
 * Пример:
 * node check-lm-studio-advanced.js http://localhost:1234
 */

// Используем встроенный fetch в Node.js 18+
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// URL по умолчанию для LM Studio
const DEFAULT_URL = 'http://localhost:1234';

// Получаем URL из аргументов командной строки или используем по умолчанию
const targetUrl = process.argv[2] || DEFAULT_URL;

console.log('🔍 Диагностика подключения к LM Studio');
console.log('=====================================');
console.log(`Целевой URL: ${targetUrl}`);
console.log('');

async function testConnection() {
  const results = {
    baseUrl: null,
    modelsEndpoint: null,
    healthEndpoint: null,
    available: false,
    models: [],
    errors: []
  };

  // Тест 1: Базовый URL
  console.log('1. Тестирование базового URL...');
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      results.baseUrl = {
        status: response.status,
        statusText: response.statusText,
        success: true
      };
      console.log(`   ✅ Успешно: ${response.status} ${response.statusText}`);
    } else {
      results.baseUrl = {
        status: response.status,
        statusText: response.statusText,
        success: false
      };
      console.log(`   ❌ Ошибка: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    results.errors.push(`Базовый URL: ${error.message}`);
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  // Тест 2: Эндпоинт моделей
  console.log('\n2. Тестирование эндпоинта моделей...');
  const modelsUrl = `${targetUrl}/v1/models`;
  try {
    const response = await fetch(modelsUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      results.modelsEndpoint = {
        status: response.status,
        statusText: response.statusText,
        success: true
      };
      results.models = data.data || [];
      results.available = true;
      
      console.log(`   ✅ Успешно: ${response.status} ${response.statusText}`);
      console.log(`   📦 Найдено моделей: ${results.models.length}`);
      
      if (results.models.length > 0) {
        console.log('   🤖 Доступные модели:');
        results.models.slice(0, 5).forEach((model, index) => {
          console.log(`      ${index + 1}. ${model.id}`);
        });
        if (results.models.length > 5) {
          console.log(`      ... и еще ${results.models.length - 5} моделей`);
        }
      }
    } else {
      results.modelsEndpoint = {
        status: response.status,
        statusText: response.statusText,
        success: false
      };
      console.log(`   ❌ Ошибка: ${response.status} ${response.statusText}`);
      results.errors.push(`Модели: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    results.errors.push(`Модели: ${error.message}`);
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  // Тест 3: Эндпоинт здоровья (если доступен)
  console.log('\n3. Тестирование эндпоинта здоровья...');
  const healthUrls = [
    `${targetUrl}/health`,
    `${targetUrl}/v1/health`,
    `${targetUrl}/status`
  ];
  
  for (const healthUrl of healthUrls) {
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        results.healthEndpoint = {
          url: healthUrl,
          status: response.status,
          statusText: response.statusText,
          success: true
        };
        console.log(`   ✅ Успешно (${healthUrl}): ${response.status} ${response.statusText}`);
        break;
      }
    } catch (error) {
      // Игнорируем ошибки для health endpoint, так как он может отсутствовать
    }
  }
  
  if (!results.healthEndpoint) {
    console.log('   ⚠️  Эндпоинт здоровья не найден (это нормально для LM Studio)');
  }

  // Вывод итогов
  console.log('\n📊 Итоги диагностики:');
  console.log('====================');
  
  if (results.available) {
    console.log('✅ LM Studio доступен и работает правильно!');
    console.log(`📍 Рабочий URL: ${targetUrl}`);
    console.log(`📦 Доступно моделей: ${results.models.length}`);
    
    if (results.models.length > 0) {
      console.log('\n💡 Рекомендации:');
      console.log('   • Используйте любой из доступных моделей для чата');
      console.log('   • Для начала работы выберите первую модель из списка');
      console.log('   • Убедитесь, что модель загружена в LM Studio');
    }
  } else {
    console.log('❌ LM Studio недоступен или настроен неправильно');
    console.log('\n💡 Что проверить:');
    console.log('   1. Запущен ли LM Studio?');
    console.log('   2. Правильный ли порт? (по умолчанию 1234)');
    console.log('   3. Запущен ли локальный сервер в LM Studio?');
    console.log('   4. Не блокирует ли подключение файрвол?');
    console.log('   5. Загружена ли хотя бы одна модель в LM Studio?');
    
    if (results.errors.length > 0) {
      console.log('\n🔍 Обнаруженные ошибки:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  }

  // Вывод в формате JSON для использования в других скриптах
  console.log('\n📋 Результат в формате JSON:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Запускаем диагностику
testConnection().catch(error => {
  console.error('❌ Критическая ошибка при выполнении диагностики:', error);
  process.exit(1);
});