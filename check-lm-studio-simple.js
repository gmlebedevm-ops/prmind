#!/usr/bin/env node

/**
 * Простой скрипт для диагностики подключения к LM Studio
 * Использует встроенный fetch в Node.js 18+
 * 
 * Использование:
 * node check-lm-studio-simple.js [url]
 * 
 * Пример:
 * node check-lm-studio-simple.js http://localhost:1234
 */

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
    available: false,
    models: [],
    errors: []
  };

  // Тест 1: Базовый URL
  console.log('1. Тестирование базового URL...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(modelsUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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