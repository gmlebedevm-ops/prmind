import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface ChecklistItem {
  title: string;
  completed: boolean;
  category: string;
  subcategory?: string;
}

interface ParsedChecklist {
  [category: string]: {
    [subcategory: string]: ChecklistItem[];
  };
}

// Функция для очистки названия от спецсимволов
function cleanTitle(title: string): string {
  return title.trim()
    .replace(/[\ud800-\udfff]./g, '') // Удаляем разорванные суррогатные пары
    .replace(/^[🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀\s]+/, '') // Удаляем эмодзи и пробелы в начале
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
    .trim();
}

// Функция для парсинга CHECKLIST.md
function parseChecklist(): ParsedChecklist {
  const checklistPath = path.join(process.cwd(), 'CHECKLIST.md');
  const content = fs.readFileSync(checklistPath, 'utf-8');
  
  const result: ParsedChecklist = {};
  let currentCategory = '';
  let currentSubcategory = '';
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Категории (## 🔐 Аутентификация и авторизация)
    const categoryMatch = line.match(/^##\s+(?:[🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀]\s*)?(.+)$/);
    if (categoryMatch) {
      currentCategory = cleanTitle(categoryMatch[1]);
      currentSubcategory = '';
      result[currentCategory] = {};
      continue;
    }
    
    // Подкатегории (### ✅ Выполнено)
    const subcategoryMatch = line.match(/^###\s+(.+)$/);
    if (subcategoryMatch && currentCategory) {
      currentSubcategory = cleanTitle(subcategoryMatch[1]);
      result[currentCategory][currentSubcategory] = [];
      continue;
    }
    
    // Пункты чек-листа (- [x] Текст или - [ ] Текст)
    const itemMatch = line.match(/^-\s+\[([x])\]\s*(.+)$/);
    if (itemMatch && currentCategory && currentSubcategory) {
      const completed = itemMatch[1] === 'x';
      const title = itemMatch[2].trim();
      
      // Пропускаем служебные пункты
      if (title.includes('Чек-лист основан') || title.includes('Приоритеты могут меняться')) {
        continue;
      }
      
      result[currentCategory][currentSubcategory].push({
        title,
        completed,
        category: currentCategory,
        subcategory: currentSubcategory
      });
    }
  }
  
  return result;
}

// Функция для создания статуса задачи на основе завершенности
function getTaskStatus(completed: boolean): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  if (completed) return 'DONE';
  return 'TODO';
}

// Функция для создания приоритета задачи
function getTaskPriority(title: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('срочно') || lowerTitle.includes('критический') || lowerTitle.includes('безопасность')) {
    return 'URGENT';
  }
  
  if (lowerTitle.includes('важно') || lowerTitle.includes('основной') || lowerTitle.includes('ключевой')) {
    return 'HIGH';
  }
  
  if (lowerTitle.includes('дополнительно') || lowerTitle.includes('опционально') || lowerTitle.includes('улучшение')) {
    return 'LOW';
  }
  
  return 'MEDIUM';
}

// Основная функция для создания задач
async function createChecklistTasks() {
  try {
    const projectId = 'cmejt24gq0005mdn3p8a7q3ki'; // ID проекта "Разработка ProjectMind"
    const creatorId = 'cmejls36z0000mdpbs6mct6g6'; // ID администратора
    
    console.log('Начинаю парсинг CHECKLIST.md...');
    const checklist = parseChecklist();
    
    console.log('Создаю задачи для проекта...');
    
    // Счетчики для статистики
    let mainTasksCreated = 0;
    let subtasksCreated = 0;
    
    for (const [category, subcategories] of Object.entries(checklist)) {
      const cleanCategory = cleanTitle(category);
      
      // Пропускаем служебные категории
      if (cleanCategory.includes('Статус разработки') || 
          cleanCategory.includes('Приоритеты разработки') || 
          cleanCategory.includes('Примечания') ||
          cleanCategory.includes('Обзор')) {
        console.log(`⏭️  Пропуск служебной категории: ${cleanCategory}`);
        continue;
      }
      
      console.log(`\n📂 Обработка категории: ${cleanCategory}`);
      
      // Создаем основную задачу для категории
      const mainTask = await db.task.create({
        data: {
          title: cleanCategory,
          description: `Основная задача для категории: ${cleanCategory}`,
          status: 'TODO',
          priority: 'HIGH',
          projectId,
          creatorId,
          // Устанавливаем срок через 3 месяца для крупных задач
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      });
      
      mainTasksCreated++;
      console.log(`✅ Создана основная задача: ${cleanCategory} (ID: ${mainTask.id})`);
      
      // Обрабатываем подкатегории и пункты
      for (const [subcategory, items] of Object.entries(subcategories)) {
        const cleanSubcategory = cleanTitle(subcategory);
        console.log(`  📋 Подкатегория: ${cleanSubcategory}`);
        
        // Создаем задачу для подкатегории, если есть пункты
        if (items.length > 0) {
          const subcategoryTask = await db.task.create({
            data: {
              title: `${cleanCategory} - ${cleanSubcategory}`,
              description: `Задачи для подкатегории: ${cleanSubcategory}`,
              status: getTaskStatus(items.every(item => item.completed)),
              priority: 'MEDIUM',
              projectId,
              creatorId,
              parentTaskId: mainTask.id,
              // Устанавливаем срок через 1-2 месяца
              dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
            }
          });
          
          console.log(`    ✅ Создана задача подкатегории: ${cleanSubcategory} (ID: ${subcategoryTask.id})`);
          
          // Создаем подзадачи для каждого пункта
          for (const item of items) {
            const cleanItemTitle = cleanTitle(item.title);
            const subtask = await db.task.create({
              data: {
                title: cleanItemTitle,
                description: `Пункт чек-листа из категории "${cleanCategory}"`,
                status: getTaskStatus(item.completed),
                priority: getTaskPriority(cleanItemTitle),
                projectId,
                creatorId,
                parentTaskId: subcategoryTask.id,
                // Устанавливаем срок через 2-4 недели
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                // Если задача завершена, устанавливаем дату завершения
                completedAt: item.completed ? new Date() : null
              }
            });
            
            subtasksCreated++;
            console.log(`      ✅ Создана подзадача: ${cleanItemTitle.substring(0, 50)}... (${item.completed ? 'Выполнено' : 'В работе'})`);
          }
        }
      }
    }
    
    console.log('\n🎉 Статистика создания задач:');
    console.log(`📊 Основных задач создано: ${mainTasksCreated}`);
    console.log(`📋 Задач подкатегорий создано: ${mainTasksCreated}`); // По одной на каждую подкатегорию
    console.log(`✅ Подзадач создано: ${subtasksCreated}`);
    console.log(`📈 Всего задач создано: ${mainTasksCreated + mainTasksCreated + subtasksCreated}`);
    
    console.log('\n🔍 Проверка созданных задач...');
    
    // Проверяем количество созданных задач
    const taskCount = await db.task.count({
      where: { projectId }
    });
    
    console.log(`📊 Всего задач в проекте: ${taskCount}`);
    
    // Показываем пример иерархии
    const sampleMainTask = await db.task.findFirst({
      where: { 
        projectId,
        parentTaskId: null 
      },
      include: {
        subtasks: {
          include: {
            subtasks: true
          }
        }
      }
    });
    
    if (sampleMainTask) {
      console.log('\n📋 Пример иерархии задач:');
      console.log(`📂 ${sampleMainTask.title}`);
      for (const subcategoryTask of sampleMainTask.subtasks) {
        console.log(`  📋 ${subcategoryTask.title} (${subcategoryTask.status})`);
        for (const itemTask of subcategoryTask.subtasks) {
          console.log(`    ✅ ${itemTask.title} (${itemTask.status})`);
        }
      }
    }
    
    console.log('\n✅ Задачи успешно созданы на основе CHECKLIST.md!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании задач:', error);
    throw error;
  }
}

// Запуск скрипта
if (require.main === module) {
  createChecklistTasks()
    .then(() => {
      console.log('\n🚀 Скрипт завершен успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Скрипт завершился с ошибкой:', error);
      process.exit(1);
    });
}

export { createChecklistTasks, parseChecklist };