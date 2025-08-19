import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST /api/ai/settings/client-test - Клиентское тестирование подключения (для случаев, когда сервер не может достучаться до LM Studio)
export async function POST(request: NextRequest) {
  try {
    console.log('Получен запрос к /api/ai/settings/client-test');
    
    let body;
    try {
      body = await request.json();
      console.log('Тело запроса:', body);
    } catch (jsonError) {
      console.error('Ошибка разбора JSON:', jsonError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка разбора запроса',
          message: 'Неверный формат JSON'
        },
        { status: 400 }
      );
    }

    const { provider, testResult } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'Провайдер не указан' },
        { status: 400 }
      );
    }

    if (!testResult) {
      return NextResponse.json(
        { error: 'Результат тестирования не предоставлен' },
        { status: 400 }
      );
    }

    console.log(`Получен результат клиентского тестирования для провайдера: ${provider}`);

    // Для LM Studio просто возвращаем результат, полученный от клиента
    if (provider === 'LM_STUDIO') {
      return NextResponse.json({
        success: testResult.success,
        message: testResult.success ? 'Подключение к LM Studio успешно установлено' : 'Ошибка подключения к LM Studio',
        baseUrl: testResult.baseUrl,
        models: testResult.models,
        response: testResult.response,
        error: testResult.error,
        clientTest: true // Флаг, что тест выполнен на клиенте
      });
    }

    // Для других провайдеров возвращаем ошибку, так как они должны тестироваться на сервере
    return NextResponse.json(
      { 
        success: false, 
        error: 'Неподдерживаемый провайдер для клиентского тестирования',
        message: 'Только LM Studio поддерживает клиентское тестирование'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Ошибка обработки клиентского теста:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        message: error.message 
      },
      { status: 500 }
    );
  }
}