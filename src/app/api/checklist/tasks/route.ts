import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// Временное хранилище задач (в реальном приложении это будет база данных)
let checklistTasks = [
  // Аутентификация
  { id: 'auth-1', content: 'Восстановление пароля', status: 'pending', priority: 'medium', category: 'auth' },
  { id: 'auth-2', content: 'Подтверждение email', status: 'pending', priority: 'medium', category: 'auth' },
  { id: 'auth-3', content: 'Двухфакторная аутентификация', status: 'pending', priority: 'low', category: 'auth' },
  { id: 'auth-4', content: 'Профиль пользователя с настройками', status: 'pending', priority: 'high', category: 'auth' },
  { id: 'auth-5', content: 'Смена пароля', status: 'pending', priority: 'medium', category: 'auth' },
  { id: 'auth-6', content: 'Управление сессиями', status: 'pending', priority: 'medium', category: 'auth' },
  { id: 'auth-7', content: 'JWT токены вместо localStorage', status: 'pending', priority: 'high', category: 'auth' },
  { id: 'auth-8', content: 'OAuth интеграция (Google, GitHub)', status: 'pending', priority: 'low', category: 'auth' },
  
  // Управление пользователями
  { id: 'users-1', content: 'Страница управления пользователями (для ADMIN)', status: 'pending', priority: 'high', category: 'users' },
  { id: 'users-2', content: 'Редактирование пользователей', status: 'pending', priority: 'medium', category: 'users' },
  { id: 'users-3', content: 'Блокировка/разблокировка пользователей', status: 'pending', priority: 'medium', category: 'users' },
  { id: 'users-4', content: 'Удаление пользователей', status: 'pending', priority: 'medium', category: 'users' },
  { id: 'users-5', content: 'История активности пользователей', status: 'pending', priority: 'low', category: 'users' },
  { id: 'users-6', content: 'Назначение ролей и прав доступа', status: 'pending', priority: 'high', category: 'users' },
  { id: 'users-7', content: 'Аватары пользователей', status: 'pending', priority: 'medium', category: 'users' },
  { id: 'users-8', content: 'Отделы и команды', status: 'pending', priority: 'medium', category: 'users' },
  
  // Управление проектами
  { id: 'projects-1', content: 'Редактирование проектов', status: 'pending', priority: 'high', category: 'projects' },
  { id: 'projects-2', content: 'Удаление проектов', status: 'pending', priority: 'high', category: 'projects' },
  { id: 'projects-3', content: 'Архивирование проектов', status: 'pending', priority: 'medium', category: 'projects' },
  { id: 'projects-4', content: 'Шаблоны проектов', status: 'pending', priority: 'medium', category: 'projects' },
  { id: 'projects-5', content: 'Копирование проектов', status: 'pending', priority: 'medium', category: 'projects' },
  { id: 'projects-6', content: 'Импорт/экспорт проектов', status: 'pending', priority: 'low', category: 'projects' },
  { id: 'projects-7', content: 'Настройка прав доступа к проектам', status: 'pending', priority: 'high', category: 'projects' },
  { id: 'projects-8', content: 'История изменений проектов', status: 'pending', priority: 'low', category: 'projects' },
  { id: 'projects-9', content: 'Вложенные проекты', status: 'pending', priority: 'low', category: 'projects' },
  { id: 'projects-10', content: 'Бюджетирование проектов', status: 'pending', priority: 'medium', category: 'projects' },
  { id: 'projects-11', content: 'Таймлайн проектов', status: 'pending', priority: 'medium', category: 'projects' },
  
  // Управление задачами
  { id: 'tasks-1', content: 'Редактирование задач', status: 'pending', priority: 'high', category: 'tasks' },
  { id: 'tasks-2', content: 'Удаление задач', status: 'pending', priority: 'high', category: 'tasks' },
  { id: 'tasks-3', content: 'Перетаскивание задач (drag & drop)', status: 'pending', priority: 'high', category: 'tasks' },
  { id: 'tasks-4', content: 'Kanban доска', status: 'pending', priority: 'high', category: 'tasks' },
  { id: 'tasks-5', content: 'Фильтрация и сортировка задач', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-6', content: 'Поиск задач', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-7', content: 'Массовые операции с задачами', status: 'pending', priority: 'low', category: 'tasks' },
  { id: 'tasks-8', content: 'Шаблоны задач', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-9', content: 'Зависимости между задачами', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-10', content: 'Время выполнения задач', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-11', content: 'Чек-листы внутри задач', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-12', content: 'Вложения файлов к задачам', status: 'pending', priority: 'medium', category: 'tasks' },
  { id: 'tasks-13', content: 'Комментарии к задачам (частично реализовано)', status: 'pending', priority: 'low', category: 'tasks' },
  
  // Теги и категории
  { id: 'tags-1', content: 'Управление тегами (CRUD)', status: 'pending', priority: 'medium', category: 'tags' },
  { id: 'tags-2', content: 'Управление категориями (CRUD)', status: 'pending', priority: 'medium', category: 'tags' },
  { id: 'tags-3', content: 'Цветовые обозначения тегов', status: 'pending', priority: 'low', category: 'tags' },
  { id: 'tags-4', content: 'Фильтрация по тегам и категориям', status: 'pending', priority: 'medium', category: 'tags' },
  { id: 'tags-5', content: 'Автоматическое присвоение тегов', status: 'pending', priority: 'low', category: 'tags' },
  { id: 'tags-6', content: 'Иерархические категории', status: 'pending', priority: 'low', category: 'tags' },
  
  // Комментарии и упоминания
  { id: 'comments-1', content: 'Редактирование комментариев', status: 'pending', priority: 'medium', category: 'comments' },
  { id: 'comments-2', content: 'Удаление комментариев', status: 'pending', priority: 'medium', category: 'comments' },
  { id: 'comments-3', content: 'Ответы на комментарии', status: 'pending', priority: 'medium', category: 'comments' },
  { id: 'comments-4', content: 'Вложения в комментариях', status: 'pending', priority: 'low', category: 'comments' },
  { id: 'comments-5', content: 'Уведомления об упоминаниях', status: 'pending', priority: 'high', category: 'comments' },
  { id: 'comments-6', content: 'Реакции на комментарии', status: 'pending', priority: 'low', category: 'comments' },
  { id: 'comments-7', content: 'История изменений комментариев', status: 'pending', priority: 'low', category: 'comments' },
  { id: 'comments-8', content: 'Форматирование текста (Markdown)', status: 'pending', priority: 'medium', category: 'comments' },
  { id: 'comments-9', content: '@упоминания с автодополнением', status: 'pending', priority: 'medium', category: 'comments' },
  
  // Учет времени
  { id: 'time-1', content: 'Таймер для отслеживания времени', status: 'pending', priority: 'high', category: 'time' },
  { id: 'time-2', content: 'Ручной ввод времени', status: 'pending', priority: 'high', category: 'time' },
  { id: 'time-3', content: 'Отчеты по затраченному времени', status: 'pending', priority: 'medium', category: 'time' },
  { id: 'time-4', content: 'Интеграция с задачами', status: 'pending', priority: 'high', category: 'time' },
  { id: 'time-5', content: 'Оплата труда на основе времени', status: 'pending', priority: 'low', category: 'time' },
  { id: 'time-6', content: 'Таймшиты', status: 'pending', priority: 'medium', category: 'time' },
  { id: 'time-7', content: 'Анализ производительности', status: 'pending', priority: 'medium', category: 'time' },
  { id: 'time-8', content: 'Калькулятор стоимости времени', status: 'pending', priority: 'low', category: 'time' },
  
  // Аналитика и отчетность
  { id: 'analytics-1', content: 'Детальная аналитика по проектам', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-2', content: 'Аналитика по пользователям', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-3', content: 'Анализ времени выполнения задач', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-4', content: 'Burn-down/ burn-up диаграммы', status: 'pending', priority: 'low', category: 'analytics' },
  { id: 'analytics-5', content: 'Отчеты по продуктивности', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-6', content: 'Экспорт отчетов (PDF, Excel)', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-7', content: 'Пользовательские дашборды', status: 'pending', priority: 'low', category: 'analytics' },
  { id: 'analytics-8', content: 'KPI и метрики', status: 'pending', priority: 'medium', category: 'analytics' },
  { id: 'analytics-9', content: 'Сравнительный анализ', status: 'pending', priority: 'low', category: 'analytics' },
  { id: 'analytics-10', content: 'Прогнозирование сроков', status: 'pending', priority: 'low', category: 'analytics' },
  
  // Календарь и планирование
  { id: 'calendar-1', content: 'Создание событий из календаря', status: 'pending', priority: 'high', category: 'calendar' },
  { id: 'calendar-2', content: 'Редактирование событий', status: 'pending', priority: 'high', category: 'calendar' },
  { id: 'calendar-3', content: 'Повторяющиеся события', status: 'pending', priority: 'medium', category: 'calendar' },
  { id: 'calendar-4', content: 'Напоминания и уведомления', status: 'pending', priority: 'high', category: 'calendar' },
  { id: 'calendar-5', content: 'Интеграция с внешними календарями (Google Calendar)', status: 'pending', priority: 'low', category: 'calendar' },
  { id: 'calendar-6', content: 'Совместное планирование', status: 'pending', priority: 'medium', category: 'calendar' },
  { id: 'calendar-7', content: 'Доступность ресурсов', status: 'pending', priority: 'medium', category: 'calendar' },
  { id: 'calendar-8', content: 'Бронирование ресурсов', status: 'pending', priority: 'medium', category: 'calendar' },
  
  // Гант-диаграммы
  { id: 'gantt-1', content: 'Интерактивная Гант-диаграмма', status: 'pending', priority: 'high', category: 'gantt' },
  { id: 'gantt-2', content: 'Редактирование сроков прямо на диаграмме', status: 'pending', priority: 'high', category: 'gantt' },
  { id: 'gantt-3', content: 'Зависимости между задачами', status: 'pending', priority: 'medium', category: 'gantt' },
  { id: 'gantt-4', content: 'Критический путь', status: 'pending', priority: 'medium', category: 'gantt' },
  { id: 'gantt-5', content: 'Ресурсное планирование', status: 'pending', priority: 'medium', category: 'gantt' },
  { id: 'gantt-6', content: 'Базовые линии для сравнения', status: 'pending', priority: 'low', category: 'gantt' },
  { id: 'gantt-7', content: 'Масштабирование и прокрутка', status: 'pending', priority: 'medium', category: 'gantt' },
  { id: 'gantt-8', content: 'Экспорт Гант-диаграмм', status: 'pending', priority: 'low', category: 'gantt' },
  
  // AI-ассистент
  { id: 'ai-1', content: 'Автоматическое распределение задач', status: 'pending', priority: 'medium', category: 'ai' },
  { id: 'ai-2', content: 'Предложения по оптимизации сроков', status: 'pending', priority: 'medium', category: 'ai' },
  { id: 'ai-3', content: 'Анализ рисков проекта', status: 'pending', priority: 'medium', category: 'ai' },
  { id: 'ai-4', content: 'Обучение на основе данных проекта', status: 'pending', priority: 'low', category: 'ai' },
  { id: 'ai-5', content: 'Голосовой интерфейс', status: 'pending', priority: 'low', category: 'ai' },
  { id: 'ai-6', content: 'Автоматическое резюмирование обсуждений', status: 'pending', priority: 'medium', category: 'ai' },
  { id: 'ai-7', content: 'Интеграция с календарем и планированием', status: 'pending', priority: 'medium', category: 'ai' },
  { id: 'ai-8', content: 'Предиктивная аналитика', status: 'pending', priority: 'low', category: 'ai' },
  { id: 'ai-9', content: 'Мультиязычная поддержка AI', status: 'pending', priority: 'low', category: 'ai' },
  
  // Уведомления
  { id: 'notifications-1', content: 'Система уведомлений в приложении', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-2', content: 'Email уведомления', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-3', content: 'Push-уведомления', status: 'pending', priority: 'medium', category: 'notifications' },
  { id: 'notifications-4', content: 'Настройки уведомлений для пользователей', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-5', content: 'Шаблоны уведомлений', status: 'pending', priority: 'medium', category: 'notifications' },
  { id: 'notifications-6', content: 'История уведомлений', status: 'pending', priority: 'low', category: 'notifications' },
  { id: 'notifications-7', content: 'Мгновенные уведомления (WebSocket)', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-8', content: 'Уведомления о дедлайнах', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-9', content: 'Уведомления об упоминаниях', status: 'pending', priority: 'high', category: 'notifications' },
  { id: 'notifications-10', content: 'Еженедельные/ежемесячные отчеты', status: 'pending', priority: 'medium', category: 'notifications' },
  
  // Поиск и фильтрация
  { id: 'search-1', content: 'Глобальный поиск по проектам и задачам', status: 'pending', priority: 'high', category: 'search' },
  { id: 'search-2', content: 'Расширенные фильтры', status: 'pending', priority: 'high', category: 'search' },
  { id: 'search-3', content: 'Сохраненные фильтры', status: 'pending', priority: 'medium', category: 'search' },
  { id: 'search-4', content: 'Поиск по пользователям', status: 'pending', priority: 'medium', category: 'search' },
  { id: 'search-5', content: 'Полнотекстовый поиск', status: 'pending', priority: 'medium', category: 'search' },
  { id: 'search-6', content: 'Поиск по комментариям', status: 'pending', priority: 'medium', category: 'search' },
  { id: 'search-7', content: 'Поиск по вложениям', status: 'pending', priority: 'low', category: 'search' },
  { id: 'search-8', content: 'История поиска', status: 'pending', priority: 'low', category: 'search' },
  { id: 'search-9', content: 'Поиск по датам', status: 'pending', priority: 'medium', category: 'search' },
  { id: 'search-10', content: 'Поиск по статусам и приоритетам', status: 'pending', priority: 'medium', category: 'search' },
  
  // Файловый менеджер
  { id: 'files-1', content: 'Загрузка файлов', status: 'pending', priority: 'high', category: 'files' },
  { id: 'files-2', content: 'Хранение файлов (локальное/облако)', status: 'pending', priority: 'high', category: 'files' },
  { id: 'files-3', content: 'Предпросмотр файлов', status: 'pending', priority: 'medium', category: 'files' },
  { id: 'files-4', content: 'Версии файлов', status: 'pending', priority: 'medium', category: 'files' },
  { id: 'files-5', content: 'Права доступа к файлам', status: 'pending', priority: 'medium', category: 'files' },
  { id: 'files-6', content: 'Поиск файлов', status: 'pending', priority: 'medium', category: 'files' },
  { id: 'files-7', content: 'Интеграция с облачными хранилищами', status: 'pending', priority: 'low', category: 'files' },
  { id: 'files-8', content: 'Сканирование документов', status: 'pending', priority: 'low', category: 'files' },
  { id: 'files-9', content: 'Ограничение размера файлов', status: 'pending', priority: 'medium', category: 'files' },
  { id: 'files-10', content: 'Антивирусная проверка', status: 'pending', priority: 'low', category: 'files' },
  
  // Мобильная версия
  { id: 'mobile-1', content: 'Адаптивный дизайн для мобильных устройств', status: 'pending', priority: 'high', category: 'mobile' },
  { id: 'mobile-2', content: 'Мобильное меню', status: 'pending', priority: 'high', category: 'mobile' },
  { id: 'mobile-3', content: 'Touch-жесты', status: 'pending', priority: 'medium', category: 'mobile' },
  { id: 'mobile-4', content: 'PWA (Progressive Web App)', status: 'pending', priority: 'medium', category: 'mobile' },
  { id: 'mobile-5', content: 'Офлайн-режим', status: 'pending', priority: 'low', category: 'mobile' },
  { id: 'mobile-6', content: 'Push-уведомления на мобильных', status: 'pending', priority: 'medium', category: 'mobile' },
  { id: 'mobile-7', content: 'Оптимизация производительности', status: 'pending', priority: 'medium', category: 'mobile' },
  { id: 'mobile-8', content: 'Мобильные виджеты', status: 'pending', priority: 'low', category: 'mobile' },
  
  // Интеграции
  { id: 'integrations-1', content: 'API для внешних систем', status: 'pending', priority: 'medium', category: 'integrations' },
  { id: 'integrations-2', content: 'Webhooks', status: 'pending', priority: 'medium', category: 'integrations' },
  { id: 'integrations-3', content: 'Интеграция с Slack/Microsoft Teams', status: 'pending', priority: 'medium', category: 'integrations' },
  { id: 'integrations-4', content: 'Интеграция с GitHub/GitLab', status: 'pending', priority: 'medium', category: 'integrations' },
  { id: 'integrations-5', content: 'Интеграция с Jira', status: 'pending', priority: 'low', category: 'integrations' },
  { id: 'integrations-6', content: 'Интеграция с Trello', status: 'pending', priority: 'low', category: 'integrations' },
  { id: 'integrations-7', content: 'Интеграция с Google Workspace', status: 'pending', priority: 'low', category: 'integrations' },
  { id: 'integrations-8', content: 'Интеграция с Office 365', status: 'pending', priority: 'low', category: 'integrations' },
  { id: 'integrations-9', content: 'Zapier/Integromat интеграция', status: 'pending', priority: 'low', category: 'integrations' },
  
  // Пользовательский интерфейс
  { id: 'ui-1', content: 'Темизация и кастомизация', status: 'pending', priority: 'medium', category: 'ui' },
  { id: 'ui-2', content: 'Языковые локализации (EN, DE и др.)', status: 'pending', priority: 'medium', category: 'ui' },
  { id: 'ui-3', content: 'Доступность (a11y)', status: 'pending', priority: 'medium', category: 'ui' },
  { id: 'ui-4', content: 'Анимации и переходы', status: 'pending', priority: 'low', category: 'ui' },
  { id: 'ui-5', content: 'Пользовательские настройки интерфейса', status: 'pending', priority: 'medium', category: 'ui' },
  { id: 'ui-6', content: 'Скрытые/показываемые панели', status: 'pending', priority: 'low', category: 'ui' },
  { id: 'ui-7', content: 'Горячие клавиши', status: 'pending', priority: 'low', category: 'ui' },
  { id: 'ui-8', content: 'Печать страниц', status: 'pending', priority: 'low', category: 'ui' },
  { id: 'ui-9', content: 'Режим презентации', status: 'pending', priority: 'low', category: 'ui' },
  
  // Администрирование
  { id: 'admin-1', content: 'Панель администратора', status: 'pending', priority: 'high', category: 'admin' },
  { id: 'admin-2', content: 'Управление системой', status: 'pending', priority: 'high', category: 'admin' },
  { id: 'admin-3', content: 'Мониторинг производительности', status: 'pending', priority: 'medium', category: 'admin' },
  { id: 'admin-4', content: 'Логи и аудит', status: 'pending', priority: 'high', category: 'admin' },
  { id: 'admin-5', content: 'Бэкапы и восстановление', status: 'pending', priority: 'medium', category: 'admin' },
  { id: 'admin-6', content: 'Обновление системы', status: 'pending', priority: 'medium', category: 'admin' },
  { id: 'admin-7', content: 'Управление плагинами', status: 'pending', priority: 'low', category: 'admin' },
  { id: 'admin-8', content: 'Системные настройки', status: 'pending', priority: 'high', category: 'admin' },
  { id: 'admin-9', content: 'Мониторинг ошибок', status: 'pending', priority: 'medium', category: 'admin' },
  { id: 'admin-10', content: 'Статистика использования', status: 'pending', priority: 'medium', category: 'admin' },
  
  // Производительность и оптимизация
  { id: 'perf-1', content: 'Кеширование данных', status: 'pending', priority: 'high', category: 'perf' },
  { id: 'perf-2', content: 'Оптимизация запросов к БД', status: 'pending', priority: 'high', category: 'perf' },
  { id: 'perf-3', content: 'Ленивая загрузка компонентов', status: 'pending', priority: 'medium', category: 'perf' },
  { id: 'perf-4', content: 'Оптимизация изображений', status: 'pending', priority: 'medium', category: 'perf' },
  { id: 'perf-5', content: 'CDN для статических файлов', status: 'pending', priority: 'low', category: 'perf' },
  { id: 'perf-6', content: 'Сжатие данных', status: 'pending', priority: 'medium', category: 'perf' },
  { id: 'perf-7', content: 'Оптимизация бандла', status: 'pending', priority: 'medium', category: 'perf' },
  { id: 'perf-8', content: 'Мониторинг производительности', status: 'pending', priority: 'medium', category: 'perf' },
  { id: 'perf-9', content: 'Тестирование нагрузки', status: 'pending', priority: 'low', category: 'perf' },
  { id: 'perf-10', content: 'Оптимизация для SEO', status: 'pending', priority: 'low', category: 'perf' },
  
  // Безопасность
  { id: 'security-1', content: 'JWT токены с обновлением', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-2', content: 'CSRF защита', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-3', content: 'XSS защита', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-4', content: 'SQL инъекции защита', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-5', content: 'Rate limiting', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-6', content: 'Аудит безопасности', status: 'pending', priority: 'medium', category: 'security' },
  { id: 'security-7', content: 'Шифрование данных', status: 'pending', priority: 'high', category: 'security' },
  { id: 'security-8', content: 'Резервное копирование', status: 'pending', priority: 'medium', category: 'security' },
  { id: 'security-9', content: 'Политики паролей', status: 'pending', priority: 'medium', category: 'security' },
  { id: 'security-10', content: 'Безопасная передача данных (HTTPS)', status: 'pending', priority: 'high', category: 'security' },
  
  // Тестирование
  { id: 'testing-1', content: 'Unit-тесты', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-2', content: 'Integration-тесты', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-3', content: 'E2E-тесты', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-4', content: 'Тестирование UI', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-5', content: 'Тестирование безопасности', status: 'pending', priority: 'high', category: 'testing' },
  { id: 'testing-6', content: 'Тестирование производительности', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-7', content: 'Тестирование на разных устройствах', status: 'pending', priority: 'medium', category: 'testing' },
  { id: 'testing-8', content: 'A/B тестирование', status: 'pending', priority: 'low', category: 'testing' },
  { id: 'testing-9', content: 'Автоматизированное тестирование', status: 'pending', priority: 'high', category: 'testing' },
  { id: 'testing-10', content: 'Тестовые данные и окружения', status: 'pending', priority: 'medium', category: 'testing' },
  
  // Документация
  { id: 'docs-1', content: 'Пользовательская документация', status: 'pending', priority: 'medium', category: 'docs' },
  { id: 'docs-2', content: 'API документация', status: 'pending', priority: 'high', category: 'docs' },
  { id: 'docs-3', content: 'Документация для разработчиков', status: 'pending', priority: 'medium', category: 'docs' },
  { id: 'docs-4', content: 'Видеоинструкции', status: 'pending', priority: 'low', category: 'docs' },
  { id: 'docs-5', content: 'FAQ', status: 'pending', priority: 'medium', category: 'docs' },
  { id: 'docs-6', content: 'Best practices', status: 'pending', priority: 'low', category: 'docs' },
  { id: 'docs-7', content: 'Архитектурная документация', status: 'pending', priority: 'medium', category: 'docs' },
  { id: 'docs-8', content: 'Документация по развертыванию', status: 'pending', priority: 'medium', category: 'docs' },
  { id: 'docs-9', content: 'Документация по миграциям', status: 'pending', priority: 'medium', category: 'docs' },
  
  // Развертывание и DevOps
  { id: 'devops-1', content: 'Docker контейнеризация', status: 'pending', priority: 'high', category: 'devops' },
  { id: 'devops-2', content: 'CI/CD пайплайны', status: 'pending', priority: 'high', category: 'devops' },
  { id: 'devops-3', content: 'Конфигурация для продакшена', status: 'pending', priority: 'high', category: 'devops' },
  { id: 'devops-4', content: 'Мониторинг и логирование', status: 'pending', priority: 'high', category: 'devops' },
  { id: 'devops-5', content: 'Автоматическое масштабирование', status: 'pending', priority: 'medium', category: 'devops' },
  { id: 'devops-6', content: 'Управление окружениями', status: 'pending', priority: 'medium', category: 'devops' },
  { id: 'devops-7', content: 'Деплой на облачные платформы', status: 'pending', priority: 'medium', category: 'devops' },
  { id: 'devops-8', content: 'Управление зависимостями', status: 'pending', priority: 'medium', category: 'devops' },
  { id: 'devops-9', content: 'Версионирование', status: 'pending', priority: 'medium', category: 'devops' },
  { id: 'devops-10', content: 'Откат изменений', status: 'pending', priority: 'medium', category: 'devops' }
];

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request.headers);
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Возвращаем все задачи
    return NextResponse.json({ tasks: checklistTasks });
  } catch (error) {
    console.error('Ошибка получения задач чек-листа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request.headers);
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { taskId, status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Недопустимый статус' }, { status: 400 });
    }

    // Находим задачу и обновляем статус
    const taskIndex = checklistTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    checklistTasks[taskIndex].status = status;

    return NextResponse.json({ task: checklistTasks[taskIndex] });
  } catch (error) {
    console.error('Ошибка обновления задачи чек-листа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}