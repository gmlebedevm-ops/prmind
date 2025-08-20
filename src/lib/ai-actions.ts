import { db } from '@/lib/db';

// Интерфейс для распознанного действия
interface AIAction {
  type: 'create_project' | 'create_task' | 'update_project' | 'update_task' | 'unknown';
  data: any;
  confidence: number;
}

// Интерфейс для результата выполнения действия
interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Класс для парсинга и выполнения действий из ответов AI
export class AIActionExecutor {
  
  /**
   * Парсит ответ AI и определяет, содержит ли он инструкции по выполнению действий
   */
  static parseActionFromResponse(aiResponse: string): AIAction | null {
    const response = aiResponse.toLowerCase();
    
    // Проверка на создание проекта
    const projectPatterns = [
      /проект\s+["']([^"']+)["']\s+(?:создан|создала|создал)/i,
      /создала?\s+проект\s+["']([^"']+)["']/i,
      /новый\s+проект\s+["']([^"']+)["']\s+(?:успешно\s+)?создан/i,
      /проект\s+["']([^"']+)["']\s+успешно\s+создан/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        return {
          type: 'create_project',
          data: {
            title: match[1],
            description: this.extractDescription(aiResponse, 'проект'),
            status: this.extractStatus(aiResponse)
          },
          confidence: 0.9
        };
      }
    }
    
    // Проверка на создание задачи
    const taskPatterns = [
      /задача\s+["']([^"']+)["']\s+(?:добавлена|создана|создал|создала)/i,
      /(?:добавила?\s+|создала?\s+)задачу\s+["']([^"']+)["']/i,
      /задача\s+["']([^"']+)["']\s+успешно\s+(?:добавлена|создана)/i,
      /["']([^"']+)["']\s+задача\s+(?:добавлена|создана)/i
    ];
    
    for (const pattern of taskPatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        const taskData: any = {
          title: match[1],
          description: this.extractDescription(aiResponse, 'задача'),
          priority: this.extractPriority(aiResponse),
          status: this.extractStatus(aiResponse) || 'TODO'
        };
        
        // Пытаемся извлечь дедлайн
        const deadline = this.extractDeadline(aiResponse);
        if (deadline) {
          taskData.dueDate = deadline;
        }
        
        // Пытаемся извлечь название проекта
        const projectTitle = this.extractProjectTitle(aiResponse);
        if (projectTitle) {
          taskData.projectTitle = projectTitle;
        }
        
        return {
          type: 'create_task',
          data: taskData,
          confidence: 0.9
        };
      }
    }
    
    return null;
  }
  
  /**
   * Извлекает описание из текста ответа
   */
  private static extractDescription(text: string, entityType: 'проект' | 'задача'): string | undefined {
    const patterns = [
      new RegExp(`${entityType}\\s+[^\\n]*\\s+с\\s+описанием[:\\s]*["']([^"']+)["']`, 'i'),
      new RegExp(`описание\\s+${entityType}а[:\\s]*["']([^"']+)["']`, 'i'),
      new RegExp(`${entityType}\\s+[^\\n]*\\s+описание[:\\s]*([^\\n]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /**
   * Извлекает приоритет из текста ответа
   */
  private static extractPriority(text: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      'низкий': 'LOW',
      'низшая': 'LOW',
      'средний': 'MEDIUM',
      'обычный': 'MEDIUM',
      'высокий': 'HIGH',
      'важный': 'HIGH',
      'срочный': 'URGENT',
      'критический': 'URGENT'
    };
    
    for (const [key, value] of Object.entries(priorityMap)) {
      if (text.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return 'MEDIUM'; // Приоритет по умолчанию
  }
  
  /**
   * Извлекает статус из текста ответа
   */
  private static extractStatus(text: string): string | undefined {
    const statusPatterns = [
      /статус[:\s]*([^\s,]+)/i,
      /состояние[:\s]*([^\s,]+)/i
    ];
    
    for (const pattern of statusPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    }
    
    return undefined;
  }
  
  /**
   * Извлекает дедлайн из текста ответа
   */
  private static extractDeadline(text: string): Date | undefined {
    const deadlinePatterns = [
      /дедлайн[:\s]*(?:на\s+)?([^\s,]+)/i,
      /срок[:\s]*(?:до\s+)?([^\s,]+)/i,
      /(?:к|ко)\s+([^\s,]+)/i
    ];
    
    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateText = match[1].trim();
        
        // Обрабатываем относительные даты
        if (dateText.includes('завтра')) {
          const date = new Date();
          date.setDate(date.getDate() + 1);
          return date;
        }
        
        if (dateText.includes('послезавтра')) {
          const date = new Date();
          date.setDate(date.getDate() + 2);
          return date;
        }
        
        // Обрабатываем дни недели
        const weekDays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
        const today = new Date();
        const currentDay = today.getDay();
        const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1;
        
        for (let i = 0; i < weekDays.length; i++) {
          if (dateText.includes(weekDays[i])) {
            const daysUntilTarget = i - currentDayIndex;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + (daysUntilTarget <= 0 ? daysUntilTarget + 7 : daysUntilTarget));
            return targetDate;
          }
        }
        
        // Пытаемся распарсить дату в формате ДД.ММ.ГГГГ или ДД/ММ/ГГГГ
        const dateMatch = dateText.match(/(\d{1,2})[.\/](\d{1,2})[.\/]?(\d{4})?/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]) - 1;
          const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();
          
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Извлекает название проекта из текста ответа
   */
  private static extractProjectTitle(text: string): string | undefined {
    const projectPatterns = [
      /(?:в\s+|для\s+|проект\s+)["']([^"']+)["']/i,
      /проект\s+([^,\s]+)/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /**
   * Выполняет распознанное действие
   */
  static async executeAction(action: AIAction, userId: string): Promise<ActionResult> {
    try {
      switch (action.type) {
        case 'create_project':
          return await this.createProject(action.data, userId);
        case 'create_task':
          return await this.createTask(action.data, userId);
        default:
          return {
            success: false,
            message: 'Неизвестный тип действия',
            error: `Unknown action type: ${action.type}`
          };
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      return {
        success: false,
        message: 'Ошибка при выполнении действия',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Создает проект в базе данных
   */
  private static async createProject(data: any, userId: string): Promise<ActionResult> {
    try {
      // Проверяем, существует ли уже проект с таким названием у пользователя
      const existingProject = await db.project.findFirst({
        where: {
          title: data.title,
          members: {
            some: {
              userId: userId,
              role: 'OWNER'
            }
          }
        }
      });
      
      if (existingProject) {
        return {
          success: false,
          message: `Проект "${data.title}" уже существует`,
          error: 'Project already exists'
        };
      }
      
      // Создаем проект
      const project = await db.project.create({
        data: {
          title: data.title,
          description: data.description || '',
          status: data.status || 'PLANNING',
          startDate: new Date(),
          members: {
            create: {
              userId: userId,
              role: 'OWNER'
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      return {
        success: true,
        message: `Проект "${data.title}" успешно создан`,
        data: project
      };
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      return {
        success: false,
        message: 'Ошибка при создании проекта',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Создает задачу в базе данных
   */
  private static async createTask(data: any, userId: string): Promise<ActionResult> {
    try {
      let projectId: string | undefined;
      
      // Если указано название проекта, пытаемся найти его
      if (data.projectTitle) {
        const project = await db.project.findFirst({
          where: {
            title: data.projectTitle,
            members: {
              some: {
                userId: userId
              }
            }
          }
        });
        
        if (!project) {
          return {
            success: false,
            message: `Проект "${data.projectTitle}" не найден`,
            error: 'Project not found'
          };
        }
        
        projectId = project.id;
      } else {
        // Если проект не указан, пытаемся найти любой проект пользователя
        const userProject = await db.project.findFirst({
          where: {
            members: {
              some: {
                userId: userId
              }
            }
          }
        });
        
        if (!userProject) {
          return {
            success: false,
            message: 'У вас нет проектов для создания задачи',
            error: 'No projects found'
          };
        }
        
        projectId = userProject.id;
      }
      
      // Создаем задачу
      const task = await db.task.create({
        data: {
          title: data.title,
          description: data.description || '',
          status: data.status || 'TODO',
          priority: data.priority || 'MEDIUM',
          dueDate: data.dueDate,
          projectId: projectId,
          assigneeId: userId // Назначаем задачу текущему пользователю
        },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return {
        success: true,
        message: `Задача "${data.title}" успешно создана в проекте "${task.project.title}"`,
        data: task
      };
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      return {
        success: false,
        message: 'Ошибка при создании задачи',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}