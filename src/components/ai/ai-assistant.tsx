'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Send, 
  MessageSquare, 
  Clock, 
  Trash2, 
  Plus, 
  Settings, 
  Lightbulb,
  FileText,
  Calendar,
  Users,
  BarChart3,
  CheckSquare,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIChat {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

interface AIAssistantProps {
  projectId?: string;
  taskId?: string;
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'create-task',
    label: 'Создать задачу',
    icon: <Plus className="h-4 w-4" />,
    prompt: 'Помоги создать новую задачу для этого проекта',
    category: 'tasks'
  },
  {
    id: 'analyze-progress',
    label: 'Анализ прогресса',
    icon: <BarChart3 className="h-4 w-4" />,
    prompt: 'Проанализируй текущий прогресс проекта и дай рекомендации',
    category: 'analytics'
  },
  {
    id: 'generate-report',
    label: 'Генерировать отчет',
    icon: <FileText className="h-4 w-4" />,
    prompt: 'Сгенерируй отчет о текущем состоянии проекта',
    category: 'reports'
  },
  {
    id: 'plan-schedule',
    label: 'Планирование',
    icon: <Calendar className="h-4 w-4" />,
    prompt: 'Помоги спланировать расписание для оставшихся задач',
    category: 'planning'
  },
  {
    id: 'team-suggestions',
    label: 'Рекомендации команде',
    icon: <Users className="h-4 w-4" />,
    prompt: 'Дай рекомендации по улучшению командной работы',
    category: 'team'
  },
  {
    id: 'risk-analysis',
    label: 'Анализ рисков',
    icon: <AlertCircle className="h-4 w-4" />,
    prompt: 'Проанализируй потенциальные риски для проекта',
    category: 'risks'
  }
];

export function AIAssistant({ projectId, taskId, className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AIChat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
  setTimeout(() => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 150);
};

  // Добавляем кастомные стили для прокрутки
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #messages-container {
        scrollbar-width: thin;
        scrollbar-color: #c1c1c1 #f1f1f1;
      }
      #messages-container::-webkit-scrollbar {
        width: 8px;
      }
      #messages-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      #messages-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        border: 2px solid #f1f1f1;
      }
      #messages-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      /* Убрать скроллбар в Firefox */
      #messages-container {
        scrollbar-width: none;
      }
      #messages-container::-webkit-scrollbar {
        display: block;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Дополнительная прокрутка при изменении размера окна и при загрузке
  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen, projectId, taskId]);

  // Обработка клавиши Escape для выхода из полноэкранного режима
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      // Блокируем прокрутку страницы в полноэкранном режиме
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (isFullscreen) {
        document.body.style.overflow = '';
      }
    };
  }, [isFullscreen]);

  const loadChatHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return; // Не загружаем историю если пользователь не авторизован
      }
      
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (taskId) params.append('taskId', taskId);

      const response = await fetch(`/api/ai/chats?${params}`, {
        headers: {
          'X-User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чатов:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return; // Не загружаем чат если пользователь не авторизован
      }
      
      const response = await fetch(`/api/ai/chats/${chatId}`, {
        headers: {
          'X-User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.chat.messages);
        setCurrentChatId(chatId);
        setShowHistory(false);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Проверяем наличие userId
    const userId = localStorage.getItem('userId');
    if (!userId) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Пожалуйста, войдите в систему, чтобы использовать AI-ассистента. Нажмите на кнопку "Войти в систему" на главной странице.',
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          message: inputMessage,
          projectId,
          taskId,
          chatId: currentChatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setCurrentChatId(data.chatId);
        
        // Обновляем историю чатов
        loadChatHistory();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка отправки сообщения');
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      let errorMessage = 'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.';
      
      if (error instanceof Error) {
        if (error.message.includes('Требуется аутентификация')) {
          errorMessage = 'Пожалуйста, войдите в систему, чтобы использовать AI-ассистента.';
        } else if (error.message.includes('Нет доступа к проекту')) {
          errorMessage = 'У вас нет доступа к этому проекту.';
        } else if (error.message.includes('Задача не найдена')) {
          errorMessage = 'Задача не найдена или у вас нет к ней доступа.';
        }
      }
      
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: errorMessage,
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    setInputMessage(action.prompt);
    setActiveTab('chat');
    // Автоматически отправляем сообщение после небольшой задержки
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Введите сообщение..."]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowHistory(false);
    // При выходе из полноэкранного режима при создании нового чата
    if (isFullscreen) {
      setIsFullscreen(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return; // Не удаляем чат если пользователь не авторизован
      }
      
      const response = await fetch(`/api/ai/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userId,
        },
      });

      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-4 right-4 rounded-full p-4 shadow-lg 
          bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
          text-white z-40 transition-all duration-200 hover:scale-110
          ${className}
        `}
        size="lg"
        title="Открыть AI-ассистента"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </Button>
    );
  }

  return (
    <div className={`
      ${isFullscreen 
        ? 'fixed inset-0 w-full h-full z-50 rounded-none' 
        : 'fixed bottom-4 right-4 w-[500px] h-[700px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] rounded-lg overflow-hidden'
      }
      bg-background border shadow-2xl flex flex-col ${className}
    `}>
      {/* Header */}
      <div className={`
        p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 
        flex items-center justify-between
        ${isFullscreen ? 'rounded-t-lg' : ''}
      `}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-blue-600" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI-ассистент ProjectMind</h3>
            <p className="text-xs text-gray-600">Ваш интеллектуальный помощник</p>
          </div>
          {projectId && (
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
              Проект
            </Badge>
          )}
          {taskId && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
              Задача
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="hidden sm:flex"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            className="hidden sm:flex"
          >
            Новое
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Свернуть" : "Развернуть"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            title="Закрыть"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 relative min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Чат
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Быстрые действия
          </TabsTrigger>
        </TabsList>

        {/* History Panel */}
        {showHistory && (
          <div className="border-b bg-gray-50">
            <ScrollArea className="h-48 p-4">
              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    История чатов пуста
                  </p>
                ) : (
                  chatHistory.map((chat) => (
                    <Card
                      key={chat.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => loadChat(chat.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm">
                            {chat.title || 'Новый чат'}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(chat.updatedAt).toLocaleDateString('ru-RU')}</span>
                          {chat.project && (
                            <Badge variant="outline" className="text-xs">
                              {chat.project.title}
                            </Badge>
                          )}
                          {chat.task && (
                            <Badge variant="outline" className="text-xs">
                              {chat.task.title}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <TabsContent value="chat" className="relative h-full m-0 p-0">
          {/* Messages area with absolute positioning */}
          <div className="absolute inset-0 flex flex-col pt-2 pb-16">
            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto px-4" id="messages-container">
              <div className="space-y-4 pb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="relative mb-4">
                      <Bot className="h-16 w-16 mx-auto text-blue-500" />
                      <Sparkles className="absolute top-0 right-1/2 h-6 w-6 text-purple-500 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Здравствуйте! Я AI-ассистент ProjectMind</h3>
                    <p className="text-muted-foreground mb-4">
                      Я помогу вам с управлением проектами, задачами и предоставлю интеллектуальные рекомендации
                    </p>
                    {!localStorage.getItem('userId') && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          🔒 Для использования AI-ассистента необходимо войти в систему. 
                          Пожалуйста, вернитесь на главную страницу и нажмите "Войти в систему".
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        📊 Аналитика проектов
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ✅ Управление задачами
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        🤖 Умные рекомендации
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        📈 Отчетность
                      </Badge>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`
                          max-w-[80%] rounded-lg p-3 break-words
                          ${message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-muted border'
                          }
                          ${isFullscreen ? 'max-w-[70%] lg:max-w-[60%]' : ''}
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-white">Вы</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted border rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              <div ref={messagesEndRef} className="h-8" />
              </div>
            </div>
          </div>

          {/* Fixed input area at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t bg-gray-50 p-4 z-10">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className={`
                  bg-gradient-to-r from-blue-500 to-purple-600 
                  hover:from-blue-600 hover:to-purple-700 
                  flex-shrink-0 h-10 w-10
                  ${isFullscreen ? 'px-4' : 'px-3'}
                `}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="relative h-full m-0 p-0">
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Быстрые действия</h3>
                <p className="text-sm text-muted-foreground">
                  Выберите действие, чтобы получить помощь от AI-ассистента
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action) => (
                  <Card
                    key={action.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-l-4 border-l-blue-500"
                    onClick={() => handleQuickAction(action)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{action.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {action.prompt}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Советы по использованию
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Будьте конкретны в своих запросах</li>
                  <li>• Указывайте контекст проекта или задачи</li>
                  <li>• Используйте быстрые действия для типовых задач</li>
                  <li>• AI может помочь с анализом и планированием</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}