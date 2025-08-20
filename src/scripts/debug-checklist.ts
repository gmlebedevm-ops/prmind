import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Функция для очистки названия от спецсимволов
function cleanTitle(title: string): string {
  return title.trim()
    .replace(/[\ud800-\udfff]./g, '') // Удаляем разорванные суррогатные пары
    .replace(/^[🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀\s]+/, '') // Удаляем эмодзи и пробелы в начале
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
    .trim();
}

// Функция для парсинга CHECKLIST.md
function parseChecklistSimple() {
  const checklistPath = path.join(process.cwd(), 'CHECKLIST.md');
  const content = fs.readFileSync(checklistPath, 'utf-8');
  
  const categories: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const categoryMatch = line.match(/^##\s+(?:[🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀]\s*)?(.+)$/);
    if (categoryMatch) {
      const category = cleanTitle(categoryMatch[1]);
      categories.push(category);
    }
  }
  
  return categories;
}

async function debugChecklist() {
  try {
    console.log('🔍 Отладка парсинга CHECKLIST.md...');
    
    const categories = parseChecklistSimple();
    console.log('📂 Найденные категории:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. "${cat}" (длина: ${cat.length})`);
      console.log(`   Bytes: ${Array.from(cat).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')}`);
    });
    
    console.log('\n🧪 Тестирование создания простой задачи...');
    
    const projectId = 'cmejt24gq0005mdn3p8a7q3ki';
    const creatorId = 'cmejls36z0000mdpbs6mct6g6';
    
    // Сначала просто выведем информацию и завершим работу
    console.log('\n📋 Анализ завершен. Проверьте категории выше.');
    return;
    
  } catch (error) {
    console.error('❌ Ошибка при отладке:', error);
  }
}

// Запуск скрипта
if (require.main === module) {
  debugChecklist()
    .then(() => {
      console.log('\n🚀 Отладка завершена!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Отладка завершилась с ошибкой:', error);
      process.exit(1);
    });
}