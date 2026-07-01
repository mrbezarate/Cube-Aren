import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface ThrottleData {
  lastMessageTime: number;
  messageCount: number;
}

@Injectable()
export class WsThrottleGuard implements CanActivate {
  private readonly throttleMap = new Map<string, ThrottleData>();
  private readonly MESSAGE_INTERVAL = 5000; // 5 секунд между сообщениями
  private readonly CLEANUP_INTERVAL = 300000; // Очистка каждые 5 минут

  constructor() {
    // Периодическая очистка старых записей
    setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of this.throttleMap.entries()) {
        if (now - data.lastMessageTime > this.CLEANUP_INTERVAL) {
          this.throttleMap.delete(userId);
        }
      }
    }, this.CLEANUP_INTERVAL);
  }

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const userId = client.data?.userId;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    // Проверяем только для send_message события
    if (data && typeof data === 'object' && 'content' in data) {
      const now = Date.now();
      const userThrottle = this.throttleMap.get(userId);

      if (userThrottle) {
        const timeSinceLastMessage = now - userThrottle.lastMessageTime;

        if (timeSinceLastMessage < this.MESSAGE_INTERVAL) {
          const waitTime = Math.ceil((this.MESSAGE_INTERVAL - timeSinceLastMessage) / 1000);
          throw new WsException(
            `Слишком частые сообщения. Подождите ${waitTime} сек.`
          );
        }
      }

      // Обновляем данные
      this.throttleMap.set(userId, {
        lastMessageTime: now,
        messageCount: (userThrottle?.messageCount || 0) + 1,
      });
    }

    return true;
  }
}
