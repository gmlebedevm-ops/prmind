import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Интерфейс для задачи из чек-листа
interface ChecklistTask {
  title: string;
  completed: boolean;
  category: string;
  subcategory?: string;
  description?: string;
}

// Функция для парсинга CHECKLIST.md
function parseChecklist(content: string): ChecklistTask[] {
  const tasks: ChecklistTask[] = [];
  const lines = content.split('\n');
  
  let currentCategory = '';
  let currentSubcategory = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем пустые строки и заголовки
    if (!line || line.startsWith('#') || line.startsWith('---')) {
      continue;
    }
    
    // Определяем категорию (заголовок с иконкой)
    if (line.match(/^## [🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀]/)) {
      currentCategory = line.replace(/^## [🔐👥📁✅🏷️💬⏰📊📅📈🤖📡🔍📎📱🌐🎨🛠️📈🔒🧪📚🚀]\s*/, '');
      currentSubcategory = '';
      continue;
    }
    
    // Определяем подкатегорию
    if (line.startsWith('### ✅ Выполнено') || line.startsWith('### ❌ Требуется разработка')) {
      currentSubcategory = line.replace(/^### [✅❌]\s*/, '');
      continue;
    }
    
    // Парсим задачи
    const taskMatch = line.match(/^- \[([x ])\] (.+)$/);
    if (taskMatch) {
      const completed = taskMatch[1] === 'x';
      const title = taskMatch[2];
      
      tasks.push({
        title,
        completed,
        category: currentCategory,
        subcategory: currentSubcategory,
        description: `Задача из категории "${currentCategory}"${currentSubcategory ? `, подкатегория "${currentSubcategory}"` : ''}`
      });
    }
  }
  
  return tasks;
}

// Функция для создания проекта и задач
async function createProjectMindProject() {
  try {
    console.log('Начинаю создание проекта "Разработка ProjectMind"...');
    
    // Читаем содержимое CHECKLIST.md
    const checklistPath = path.join(process.cwd(), 'CHECKLIST.md');
    
    console.log('Путь к файлу:', checklistPath);
    
    if (!fs.existsSync(checklistPath)) {
      throw new Error(`Файл CHECKLIST.md не найден по пути: ${checklistPath}`);
    }
    
    const checklistContent = fs.readFileSync(checklistPath, 'utf8');
    const tasks = parseChecklist(checklistContent);
    
    console.log(`Найдено ${tasks.length} задач в CHECKLIST.md`);
    
    // Создаем проект
    const project = await db.project.create({
      data: {
        title: 'Разработка ProjectMind',
        description: 'Полноценная система управления проектами с AI-ассистентом. Проект включает в себя разработку всех компонентов системы от аутентификации до продвинутой аналитики и интеграций.',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 год
      },
    });
    
    console.log(`Проект "${project.title}" создан с ID: ${project.id}`);
    
    // Добавляем создателя как владельца проекта (используем ID администратора)
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('Администратор не найден в базе данных');
    }
    
    await db.projectMember.create({
      data: {
        projectId: project.id,
        userId: adminUser.id,
        role: 'OWNER',
      },
    });
    console.log(`Пользователь ${adminUser.email} добавлен как владелец проекта`);
    
    // Группируем задачи по категориям для создания основных задач
    const categories = [...new Set(tasks.map(task => task.category))];
    
    console.log(`Найдено категорий: ${categories.length}`);
    
    for (const category of categories) {
      const categoryTasks = tasks.filter(task => task.category === category);
      
      console.log(`Обработка категории "${category}" с ${categoryTasks.length} задачами`);
      
      // Создаем основную задачу для категории
      const mainTask = await db.task.create({
        data: {
          title: category,
          description: `Управление и разработка функционала в категории "${category}". Включает в себя ${categoryTasks.length} подзадач.`,
          projectId: project.id,
          priority: 'HIGH',
          status: categoryTasks.some(task => !task.completed) ? 'IN_PROGRESS' : 'DONE',
          creatorId: adminUser.id,
        },
      });
      
      console.log(`Создана основная задача "${category}" с ID: ${mainTask.id}`);
      
      // Создаем подзадачи для этой категории
      for (const taskData of categoryTasks) {
        try {
          const subtask = await db.task.create({
            data: {
              title: taskData.title,
              description: taskData.description,
              projectId: project.id,
              parentTaskId: mainTask.id,
              priority: taskData.completed ? 'LOW' : 'MEDIUM',
              status: taskData.completed ? 'DONE' : 'TODO',
              creatorId: adminUser.id,
            },
          });
          
          console.log(`  - Создана подзадача "${taskData.title}" (${taskData.completed ? 'выполнена' : 'в работе'})`);
        } catch (subtaskError) {
          console.error(`Ошибка при создании подзадачи "${taskData.title}":`, subtaskError);
          // Продолжаем создание других подзадач даже если одна не создалась
        }
      }
    }
    
    // Добавляем статистику
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const progress = Math.round((completedTasks / totalTasks) * 100);
    
    console.log('\n=== Статистика созданного проекта ===');
    console.log(`Всего задач: ${totalTasks}`);
    console.log(`Выполнено: ${completedTasks}`);
    console.log(`Прогресс: ${progress}%`);
    console.log(`Категорий: ${categories.length}`);
    
    console.log('\n✅ Проект "Разработка ProjectMind" успешно создан со всеми задачами из CHECKLIST.md!');
    
    return {
      success: true,
      projectId: project.id,
      totalTasks,
      completedTasks,
      progress,
      categories: categories.length
    };
    
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    throw error;
  }
}

// Запускаем создание проекта
if (require.main === module) {
  createProjectMindProject()
    .then(() => {
      console.log('\nСкрипт завершен успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nСкрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { createProjectMindProject, parseChecklist };