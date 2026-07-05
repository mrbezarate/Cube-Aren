# 🧪 Settings System - Testing Guide

## 🚀 Быстрый старт

### 1. Подготовка

```bash
# 1. Применить миграцию БД
psql -U postgres -d underground_arena -f backend/src/database/migrations/003_add_user_settings_tables.sql

# 2. Запустить backend (Terminal 1)
cd backend
npm run dev

# 3. Запустить frontend (Terminal 2)
cd frontend
npm run dev
```

### 2. Первый тест

1. Открыть браузер: http://localhost:3000
2. Войти в аккаунт (или зарегистрироваться)
3. Перейти в профиль
4. Нажать "Редактировать профиль"
5. Должен открыться: http://localhost:3000/settings/profile

## ✅ Тест-кейсы

### Test 1: Privacy Settings

**Шаги:**
1. Перейти на `/settings/privacy`
2. Изменить "Видимость профиля" → "Только друзья"
3. Изменить "Кто может писать в чат" → "Никто"
4. Нажать "Сохранить изменения"

**Ожидаемый результат:**
- ✅ Показывается toast "Настройки конфиденциальности обновлены!"
- ✅ Данные сохранены в БД
- ✅ После перезагрузки страницы настройки сохранены

**Проверка в БД:**
```sql
SELECT * FROM privacy_settings WHERE "userId" = 'YOUR_USER_ID';
```

---

### Test 2: Notification Settings

**Шаги:**
1. Перейти на `/settings/notifications`
2. Выключить "Email уведомления" → "Маркетинговые предложения"
3. Включить "Push уведомления" → "Новое сообщение"
4. Нажать "Сохранить изменения"

**Ожидаемый результат:**
- ✅ Toast "Настройки уведомлений обновлены!"
- ✅ Toggles сохраняют состояние

**Проверка в БД:**
```sql
SELECT * FROM notification_settings WHERE "userId" = 'YOUR_USER_ID';
```

---

### Test 3: User Preferences

**Шаги:**
1. Перейти на `/settings/preferences`
2. Изменить "Язык" → "English"
3. Изменить "Тема" → "Светлая"
4. Изменить "Цветовой акцент" → "Синий"
5. Нажать "Сохранить изменения"

**Ожидаемый результат:**
- ✅ Toast "Предпочтения обновлены!"
- ✅ Выбранные опции остаются активными

**Проверка в БД:**
```sql
SELECT * FROM user_preferences WHERE "userId" = 'YOUR_USER_ID';
```

---

### Test 4: Clear History

**Шаги:**
1. Перейти на `/settings/privacy`
2. Нажать "Очистить историю посещений"
3. Подтвердить в диалоге
4. Нажать "Очистить историю турниров"
5. Подтвердить

**Ожидаемый результат:**
- ✅ 2 toast сообщения об успешной очистке
- ✅ API вызовы выполнены успешно

---

### Test 5: Block User (TODO - требует реализации UI)

**Через API (curl):**
```bash
# Заменить YOUR_JWT_TOKEN и USER_ID_TO_BLOCK
curl -X POST http://localhost:3000/api/settings/blocked/USER_ID_TO_BLOCK \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test block"}'
```

**Ожидаемый результат:**
- ✅ Status: 201 Created
- ✅ Возвращается объект BlockedUser
- ✅ Запись появляется в таблице blocked_users

**Проверка в БД:**
```sql
SELECT * FROM blocked_users WHERE "userId" = 'YOUR_USER_ID';
```

---

### Test 6: Навигация между вкладками

**Шаги:**
1. Перейти на `/settings/profile`
2. Кликнуть на "Конфиденциальность" в sidebar
3. Кликнуть на "Аккаунт"
4. Кликнуть на "Уведомления"
5. Кликнуть на "Предпочтения"
6. Кликнуть "Назад к профилю"

**Ожидаемый результат:**
- ✅ Все переходы работают без перезагрузки
- ✅ Активная вкладка подсвечивается
- ✅ "Назад к профилю" ведёт на `/profile/YOUR_USER_ID`

---

### Test 7: Redirect from old URL

**Шаги:**
1. Перейти напрямую на `/profile/edit`

**Ожидаемый результат:**
- ✅ Автоматический редирект на `/settings/profile`
- ✅ Показывается "Перенаправление..."

---

### Test 8: Auto-create default settings

**Шаги:**
1. Создать нового пользователя (зарегистрироваться)
2. Сразу перейти на `/settings/privacy`

**Ожидаемый результат:**
- ✅ Настройки загружаются с дефолтными значениями
- ✅ Не показывается ошибка "Settings not found"

**Проверка в БД:**
```sql
-- Должны быть созданы записи со значениями по умолчанию
SELECT * FROM privacy_settings WHERE "userId" = 'NEW_USER_ID';
SELECT * FROM notification_settings WHERE "userId" = 'NEW_USER_ID';
SELECT * FROM user_preferences WHERE "userId" = 'NEW_USER_ID';
```

---

### Test 9: Partial update

**Через API:**
```bash
# Обновить только одно поле
curl -X PUT http://localhost:3000/api/settings/privacy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileVisibility": "private"}'
```

**Ожидаемый результат:**
- ✅ Обновилось только `profileVisibility`
- ✅ Остальные поля остались без изменений

---

### Test 10: Error handling - Unauthorized

**Шаги:**
1. Выйти из аккаунта (logout)
2. Попытаться перейти на `/settings/profile`

**Ожидаемый результат:**
- ✅ Редирект на `/auth/login`
- ✅ Не показывается ошибка в консоли

---

### Test 11: Error handling - Invalid data

**Через API:**
```bash
# Неверное значение для enum
curl -X PUT http://localhost:3000/api/settings/privacy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileVisibility": "invalid_value"}'
```

**Ожидаемый результат:**
- ✅ Status: 400 Bad Request
- ✅ Сообщение об ошибке валидации
- ✅ Frontend показывает toast с ошибкой

---

### Test 12: Loading states

**Шаги:**
1. Открыть DevTools → Network
2. Включить Network throttling → "Slow 3G"
3. Перейти на `/settings/privacy`
4. Изменить настройки и нажать "Сохранить"

**Ожидаемый результат:**
- ✅ Показывается "Загрузка..." при загрузке страницы
- ✅ Кнопка "Сохранить" показывает спиннер во время сохранения
- ✅ Кнопка disabled пока идёт сохранение

## 🔍 Проверка в базе данных

### Посмотреть все настройки пользователя

```sql
-- Privacy
SELECT * FROM privacy_settings WHERE "userId" = 'YOUR_USER_ID';

-- Notifications
SELECT * FROM notification_settings WHERE "userId" = 'YOUR_USER_ID';

-- Preferences
SELECT * FROM user_preferences WHERE "userId" = 'YOUR_USER_ID';

-- Blocked users
SELECT 
  bu.*,
  u.username as blocked_username
FROM blocked_users bu
JOIN users u ON bu."blockedUserId" = u.id
WHERE bu."userId" = 'YOUR_USER_ID';
```

### Проверить индексы

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('privacy_settings', 'notification_settings', 'user_preferences', 'blocked_users');
```

### Проверить triggers

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid IN (
  'privacy_settings'::regclass,
  'notification_settings'::regclass,
  'user_preferences'::regclass
);
```

## 📊 Performance Testing

### Test response times

```bash
# Privacy settings
time curl -X GET http://localhost:3000/api/settings/privacy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should be < 100ms

# Update settings
time curl -X PUT http://localhost:3000/api/settings/privacy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileVisibility": "friends"}'

# Should be < 200ms
```

## 🐛 Common Issues

### Issue 1: "Cannot find module '@/lib/api'"
**Solution:** Check tsconfig.json paths configuration

### Issue 2: "Migration already applied"
**Solution:** Normal behavior, migration runs once

### Issue 3: "Settings not loading"
**Solution:** 
1. Check if migration was applied
2. Check backend logs for errors
3. Check JWT token is valid

### Issue 4: "CORS errors"
**Solution:** Check backend CORS configuration in main.ts

### Issue 5: "TypeORM sync errors"
**Solution:** Turn off `synchronize: true` and use migrations only

## ✅ Final Checklist

- [ ] Migration applied successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can navigate to all 5 settings pages
- [ ] Privacy settings load and save
- [ ] Notification settings load and save
- [ ] Preferences load and save
- [ ] Auto-create works for new users
- [ ] Redirect from /profile/edit works
- [ ] Error handling shows toasts
- [ ] Loading states work
- [ ] JWT auth works on all endpoints

## 🎉 If all tests pass

**Congratulations! Settings system is fully working!** 🚀

Now you can:
1. Deploy to production
2. Add more features (account settings page)
3. Implement blocked users UI
4. Add settings import/export
5. Add settings history (audit log)

---

**Created:** 2 июля 2026  
**Version:** 1.0.0  
