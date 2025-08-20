'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  X
} from 'lucide-react';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: string;
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

interface AIChatFullscreenProps {
  projectId?: string;
  taskId?: string;
  onClose: () => void;
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

export function AIChatFullscreen({ projectId, taskId, onClose, className }: AIChatFullscreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AIChat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 150);
  };

  // Добавляем кастомные стили для прокрутки
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ai-chat-messages {
        scrollbar-width: thin;
        scrollbar-color: #c1c1c1 #f1f1f1;
      }
      .ai-chat-messages::-webkit-scrollbar {
        width: 8px;
      }
      .ai-chat-messages::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      .ai-chat-messages::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        border: 2px solid #f1f1f1;
      }
      .ai-chat-messages::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
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

  // Дополнительная прокрутка при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [projectId, taskId]);

  const loadChatHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
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
        return;
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

    const userId = localStorage.getItem('userId');
    if (!userId) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Пожалуйста, войдите в систему, чтобы использовать AI-ассистента.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
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
      const input = document.querySelector('textarea[placeholder="Введите сообщение..."]') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowHistory(false);
    setActiveTab('chat');
  };

  const deleteChat = async (chatId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`h-full w-full flex flex-col bg-background overflow-hidden ${className}`}>
      {/* Header - фиксированный */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="mr-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative flex-shrink-0">
            <Bot className="h-6 w-6 text-blue-600" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 truncate">AI-ассистент ProjectMind</h2>
            <p className="text-sm text-gray-600 truncate">Ваш интеллектуальный помощник</p>
          </div>
          {projectId && (
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 flex-shrink-0">
              Проект
            </Badge>
          )}
          {taskId && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 flex-shrink-0">
              Задача
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            История
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
          >
            <Plus className="h-4 w-4 mr-2" />
            Новый чат
          </Button>
        </div>
      </div>

      {/* History Panel - фиксированный */}
      {showHistory && (
        <div className="flex-shrink-0 border-b bg-gray-50">
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
                        <CardTitle className="text-sm truncate">
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
                        <span>{formatDate(chat.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Основной контент с вкладками и прокруткой */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs - фиксированные */}
        <div className="flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 m-4">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Чат
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Быстрые действия
              </TabsTrigger>
            </TabsList>

            {/* Chat Content */}
            {activeTab === 'chat' && (
              <div className="h-[calc(100vh-280px)] overflow-hidden">
                {/* Messages Area - прокручиваемая */}
                <ScrollArea className="h-full ai-chat-messages px-4" ref={messagesContainerRef}>
                  <div className="space-y-4 pb-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                          <Bot className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Добро пожаловать в AI-ассистент!</h3>
                        <p className="text-muted-foreground mb-4">
                          Я готов помочь вам с управлением проектами, задачами и ответить на ваши вопросы.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                          {quickActions.slice(0, 4).map((action) => (
                            <Button
                              key={action.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAction(action)}
                              className="text-left justify-start"
                            >
                              <span className="mr-2">{action.icon}</span>
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div
                            className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt || new Date().toISOString())}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">ВЫ</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <span className="text-sm ml-2">AI печатает...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions Content */}
            {activeTab === 'actions' && (
              <div className="h-[calc(100vh-240px)] overflow-hidden">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Быстрые действия</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="h-auto p-4 text-left justify-start hover:bg-accent"
                            onClick={() => handleQuickAction(action)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-primary flex-shrink-0">
                                {action.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{action.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {action.prompt}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Советы по использованию</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium">Будьте конкретны</p>
                            <p className="text-xs text-muted-foreground">
                              Чем подробнее вы опишете свою задачу, тем точнее будет ответ
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium">Используйте контекст</p>
                            <p className="text-xs text-muted-foreground">
                              Упоминайте проекты и задачи для получения релевантных ответов
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium">Сохраняйте историю</p>
                            <p className="text-xs text-muted-foreground">
                              Чаты сохраняются автоматически, вы можете вернуться к ним позже
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </Tabs>
        </div>

        {/* Input Area - фиксированный, отображается только на вкладке чата */}
        {activeTab === 'chat' && (
          <div className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Введите сообщение..."
                className="flex-1 resize-none min-h-[60px]"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="self-end flex-shrink-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-4xl mx-auto">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        )}
      </div>
    </div>
  );
}