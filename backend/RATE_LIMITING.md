# 🛡️ Rate Limiting Configuration

## Обзор

Приложение использует `@nestjs/throttler` для защиты от спама и DDoS атак.

## Глобальные ограничения

**По умолчанию для всех endpoints:**
- **100 запросов в минуту** на пользователя

## Специальные ограничения по endpoints

### 💬 Chat (WebSocket)
- **Отправка сообщений**: 1 сообщение каждые 5 секунд
- Защита через `WsThrottleGuard`
- Сообщение пользователю: "Слишком частые сообщения. Подождите X сек."

### 👥 Friends
- **Отправка запросов в друзья** (`POST /friends/request/:userId`): 5 запросов/минуту
- Предотвращает спам запросами

### 🔍 Search
- **Поиск пользователей** (`GET /users/search`): 10 запросов/минуту
- Защищает от перегрузки базы данных

### 📊 Follow/Unfollow
- **Подписка** (`POST /users/:id/follow`): 10 запросов/минуту
- **Отписка** (`DELETE /users/:id/follow`): 10 запросов/минуту

## Обработка ошибок

### Backend
При превышении лимита сервер возвращает:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### Frontend
- HTTP ошибки (429): Показывается toast с сообщением "Слишком много запросов"
- WebSocket ошибки: Показывается точное время ожидания

## Конфигурация

### Изменение глобальных лимитов

**Файл:** `src/app.module.ts`

```typescript
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000, // время в миллисекундах (60 сек)
    limit: 100, // количество запросов
  },
]),
```

### Изменение лимитов для конкретного endpoint

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('request/:userId')
async sendFriendRequest(...) {
  // ...
}
```

### Отключение rate limiting для endpoint

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('public-data')
async getPublicData() {
  // Этот endpoint не будет проверяться
}
```

## WebSocket Rate Limiting

### Архитектура

`WsThrottleGuard` использует in-memory хранилище для отслеживания:
- Времени последнего сообщения пользователя
- Счетчика сообщений

### Очистка памяти
- Автоматическая очистка каждые 5 минут
- Удаляются пользователи, неактивные более 5 минут

### Customization

**Файл:** `src/modules/chat/guards/ws-throttle.guard.ts`

```typescript
private readonly MESSAGE_INTERVAL = 5000; // Изменить интервал
private readonly CLEANUP_INTERVAL = 300000; // Изменить частоту очистки
```

## Мониторинг

### Логирование (будущее улучшение)
Можно добавить логирование превышений лимита:

```typescript
@Injectable()
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    console.log(`Rate limit exceeded by user: ${userId}`);
    // Отправить в систему мониторинга
  }
}
```

## Best Practices

1. **Не устанавливайте слишком строгие лимиты** - можно заблокировать легитимных пользователей
2. **Используйте разные лимиты для разных действий** - критичные операции требуют более строгих лимитов
3. **Мониторьте метрики** - отслеживайте сколько пользователей достигают лимита
4. **Информируйте пользователей** - показывайте понятные сообщения об ошибках

## Производительность

### In-Memory Storage
- **Плюсы**: Быстро, нет зависимости от внешних сервисов
- **Минусы**: При перезапуске данные теряются, не работает в кластере

### Для Production (будущее)
Рекомендуется использовать Redis:

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60,
    limit: 100,
    storage: new ThrottlerStorageRedisService(redisClient),
  },
]),
```

## Troubleshooting

### "Too Many Requests" на локальной разработке
- Увеличьте лимиты в `app.module.ts`
- Или отключите для dev: `@SkipThrottle()`

### WebSocket сообщения не отправляются
- Проверьте браузер console на ошибки
- Убедитесь что прошло 5 секунд с последнего сообщения
- Проверьте что пользователь авторизован

### Rate limit не работает
- Проверьте что `APP_GUARD` зарегистрирован в providers
- Проверьте что декоратор `@Throttle()` правильно применен
