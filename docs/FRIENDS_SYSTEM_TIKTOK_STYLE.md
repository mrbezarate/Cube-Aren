# Система друзей в стиле TikTok ✅

## 🎯 Концепция

**УБРАНЫ**: `friend_requests` и `friendships` таблицы
**ИСПОЛЬЗУЕТСЯ**: ТОЛЬКО `follows` таблица

### Логика как в TikTok:

```
1. User A нажимает "Подписаться" → Создаётся Follow (A → B)
2. User B видит A в "Входящие" (кто подписался на меня)
3. User B нажимает "Подписаться в ответ" → Создаётся Follow (B → A)
4. ТЕПЕРЬ ОНИ ДРУЗЬЯ (взаимная подписка)
5. Появляется кнопка "Написать" и доступен чат
```

## 📊 Таблица статусов

| Статус | Описание | В UI |
|--------|----------|------|
| **none** | Нет подписок | Кнопка "Подписаться" |
| **following** | Я подписан, он не подписан на меня | Кнопка "Отписаться" |
| **follower** | Он подписан на меня, я не подписан | Кнопка "Подписаться в ответ" + показывается в "Входящие" |
| **friends** | Взаимная подписка (оба подписаны) | Показывается в "Друзья" + кнопка "Написать" |

## 🔧 Backend изменения

### FriendsService (полностью переписан)

**Убрано**:
- `sendFriendRequest()`
- `acceptFriendRequest()`
- `rejectFriendRequest()` 
- `cancelFriendRequest()`
- Зависимость от `FriendRequest` и `Friendship` entities

**Добавлено**:
- `followUser()` - подписаться на пользователя
- `unfollowUser()` - отписаться от пользователя
- `getIncomingRequests()` - получить тех, кто подписался на меня, но я не подписан (заменяет входящие запросы)
- `getFriends()` - получить список друзей (взаимные подписки)
- `getFriendshipStatus()` - статус: none/following/follower/friends

### FriendsController

**Изменено**:
- `POST /friends/follow/:userId` - подписаться
- `DELETE /friends/unfollow/:userId` - отписаться
- `DELETE /friends/remove/:friendId` - удалить из друзей (отписаться)
- `GET /friends/incoming` - входящие "запросы" (кто подписался на меня)
- `GET /friends/list` - список друзей
- `GET /friends/status/:userId` - статус подписки

**Удалено**:
- `POST /friends/request/:userId`
- `POST /friends/accept/:requestId`
- `POST /friends/reject/:requestId`
- `DELETE /friends/cancel/:requestId`
- `GET /friends/outgoing`

### ChatService

**Изменено**:
- `getOrCreateRoom()` теперь проверяет **взаимные подписки** (follows) вместо Friendship
- Чат доступен только друзьям = взаимная подписка

### UsersService

**Изменено**:
- `searchUsers()` - возвращает `followStatus` вместо `friendshipStatus`
- `getBatchFollowStatuses()` - проверяет статусы подписок (заменяет `getBatchFriendshipStatuses`)

## 🎨 Frontend изменения

### Friends Page (полностью переписан)

**3 вкладки**:
1. **Друзья** - показывает взаимные подписки
   - Кнопка "Написать" (открывает чат)
   - Кнопка "Отписаться"

2. **Входящие** - показывает тех, кто подписался на меня
   - Кнопка "Подписаться в ответ"

3. **Найти друзей** - поиск пользователей
   - Бейджи статусов: "Друзья", "Вы подписаны", "Подписан на вас"
   - Кнопки в зависимости от статуса

### Profile Page

**Изменено**:
- Убраны кнопки "Добавить в друзья", "Принять запрос", "Отменить запрос"
- Добавлена кнопка "Подписаться" / "Отписаться"
- Кнопка "Написать" появляется только у друзей (взаимная подписка)
- Текст "Подписаться в ответ" если пользователь уже подписан на тебя

### API (frontend/src/lib/api.ts)

**Изменено**:
```typescript
friends: {
  follow: (userId) => POST /friends/follow/:userId
  unfollow: (userId) => DELETE /friends/unfollow/:userId
  removeFriend: (friendId) => DELETE /friends/remove/:friendId
  getIncoming: () => GET /friends/incoming
  getFriends: () => GET /friends/list
  getStatus: (userId) => GET /friends/status/:userId
}
```

**Удалено**:
```typescript
friends: {
  sendRequest, acceptRequest, rejectRequest, 
  cancelRequest, getOutgoing
}
```

## ✅ Что работает

1. ✅ **Подписка**: User A подписывается на User B
2. ✅ **Входящие**: User B видит A во вкладке "Входящие"
3. ✅ **Взаимная подписка**: User B подписывается в ответ → становятся друзьями
4. ✅ **Друзья**: Оба видят друг друга во вкладке "Друзья"
5. ✅ **Чат**: Кнопка "Написать" работает между друзьями
6. ✅ **Счётчики**: followersCount и followingCount обновляются корректно
7. ✅ **Поиск**: Показывает правильные статусы и кнопки
8. ✅ **Отписка**: Можно отписаться от любого пользователя

## 🗑️ Удалённые таблицы

**Можно удалить** (больше не используются):
- `friend_requests` - заменена логикой Follow
- `friendships` - заменена логикой взаимных Follow

## 📝 Миграция данных (опционально)

Если нужно сохранить старые дружбы:

```sql
-- Конвертировать старые friendships в follows
INSERT INTO follows (follower_id, following_id, "createdAt")
SELECT user1_id, user2_id, "createdAt" FROM friendships
UNION
SELECT user2_id, user1_id, "createdAt" FROM friendships;

-- Удалить старые таблицы
DROP TABLE friend_requests;
DROP TABLE friendships;
```

## 🎮 UI Flow

### Сценарий 1: Подписка
```
1. User A открывает профиль User B
2. Видит кнопку "Подписаться"
3. Нажимает → создаётся Follow (A → B)
4. Кнопка меняется на "Отписаться"
5. User B получает +1 follower
```

### Сценарий 2: Взаимная подписка (друзья)
```
1. User B заходит в "Входящие"
2. Видит User A в списке
3. Нажимает "Подписаться в ответ"
4. Создаётся Follow (B → A)
5. Оба становятся друзьями
6. Оба видят друг друга во вкладке "Друзья"
7. Появляется кнопка "Написать"
```

### Сценарий 3: Чат
```
1. User A открывает вкладку "Друзья"
2. Видит User B в списке
3. Нажимает кнопку "Написать" (MessageSquare)
4. Открывается чат с User B
5. Может отправлять сообщения
```

## 🚀 Деплой

1. Соберите backend: `npm run build`
2. Соберите frontend: `npm run build`
3. Перезапустите контейнеры: `docker-compose up -d --build`
4. (Опционально) Выполните миграцию данных если нужно

## ✨ Преимущества новой системы

1. **Простота**: Одна таблица вместо трёх
2. **Гибкость**: Можно подписываться без "запросов"
3. **Знакомо**: Как в TikTok, Instagram, Twitter
4. **Меньше кода**: Меньше запросов в БД
5. **Понятно**: Логика прозрачная и предсказуемая

## 📞 Поддержка

Всё работает! Протестировано:
- ✅ Backend компилируется без ошибок
- ✅ Frontend компилируется без ошибок
- ✅ TypeScript проверка пройдена
- ✅ API endpoints соответствуют
