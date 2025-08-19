'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  AtSign, 
  Clock,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  mentions: string[];
}

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: {
          'X-User-ID': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId || '',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        setShowMentions(false);
      }
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewComment(value);
    
    // Проверяем, есть ли упоминание (@)
    const atMatch = value.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      // Здесь можно добавить логику поиска пользователей для упоминания
      // Для примера используем пустой массив
      setMentionUsers([]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const value = newComment;
    const atMatch = value.match(/@(\w*)$/);
    if (atMatch) {
      const beforeAt = value.substring(0, atMatch.index);
      setNewComment(beforeAt + '@' + username + ' ');
      setShowMentions(false);
    }
  };

  const formatContent = (content: string) => {
    // Заменяем упоминания на подсвеченные элементы
    return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Комментарии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Комментарии ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Список комментариев */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Пока нет комментариев</p>
              <p className="text-sm text-muted-foreground">Будьте первым, кто оставит комментарий</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>
                    {comment.author.name?.[0] || comment.author.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.name || comment.author.email}
                    </span>
                    {comment.author.id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">Вы</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                  <div 
                    className="text-sm bg-gray-50 rounded-lg p-3"
                    dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}
                  />
                  {comment.mentions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <AtSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Упомянутые: {comment.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Форма добавления комментария */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>ВЫ</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Напишите комментарий... Используйте @ для упоминания пользователей"
                  value={newComment}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                {showMentions && mentionUsers.length > 0 && (
                  <Card className="mt-2">
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        {mentionUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => insertMention(user.name || user.email)}
                            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {user.name || user.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <AtSign className="inline h-3 w-3 mr-1" />
                Используйте @username для упоминания пользователей
              </div>
              <Button 
                onClick={handleSubmitComment} 
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}