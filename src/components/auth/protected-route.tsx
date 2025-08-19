'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'USER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (!loading && user && requiredRole && user.role !== requiredRole) {
      // Проверка прав доступа
      if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      
      if (requiredRole === 'MANAGER' && user.role === 'USER') {
        router.push('/');
        return;
      }
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Будет перенаправлен на страницу аутентификации
  }

  if (requiredRole && user.role !== requiredRole) {
    return null; // Будет перенаправлен
  }

  return <>{children}</>;
}