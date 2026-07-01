# ⚡ Settings System - Quick Start

## 🚀 Что было реализовано

Полноценная система настроек с 5 вкладками:

1. **Профиль** - редактирование данных профиля
2. **Конфиденциальность** - приватность и блокировки
3. **Аккаунт** - безопасность и связанные сервисы
4. **Уведомления** - управление уведомлениями (email, push, in-app)
5. **Предпочтения** - интерфейс, язык, тема, фильтры

## 📂 Что создано

### Frontend

```
frontend/src/app/settings/
├── layout.tsx                    # Общий layout с навигацией
├── profile/page.tsx              # Настройки профиля
├── privacy/page.tsx              # Конфиденциальность
├── account/page.tsx              # Аккаунт
├── notifications/page.tsx        # Уведомления
└── preferences/page.tsx          # Предпочтения

frontend/src/app/profile/edit/page.tsx  # Redirect → /settings/profile
frontend/src/types/index.ts              # Обновлены типы
```

### Backend

```
backend/src/entities/
├── privacy-settings.entity.ts
├── notification-settings.entity.ts
├── user-preferences.entity.ts
└── blocked-user.entity.ts

backend/src/database/migrations/
└── 003_add_user_settings_tables.sql
```

## 🎯 Как протестировать

1. **Запустить приложение:**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Применить миграцию базы данных:**
   ```bash
   # Подключиться к PostgreSQL и выполнить:
   psql -U postgres -d underground_arena -f backend/src/database/migrations/003_add_user_settings_tables.sql
   ```

3. **Открыть страницу настроек:**
   - Зайти на сайт: http://localhost:3000
   - Войти в аккаунт
   - Перейти в профиль
   - Нажать "Редактировать профиль" → перенаправит в `/settings/profile`
   - Или напрямую: http://localhost:3000/settings/profile

## ⚠️ TODO: Подключить API

Сейчас используются **mock данные**. Нужно:

1. **Создать controllers в backend:**
   ```
   backend/src/modules/settings/
   ├── settings.controller.ts
   ├── settings.service.ts
   ├── settings.module.ts
   └── dto/
       ├── update-privacy.dto.ts
       ├── update-notifications.dto.ts
       └── update-preferences.dto.ts
   ```

2. **Обновить API клиент (`frontend/src/lib/api.ts`):**
   ```typescript
   export const api = {
     // ... existing methods
     
     settings: {
       // Privacy
       getPrivacySettings: () => 
         axios.get('/settings/privacy'),
       updatePrivacySettings: (data: PrivacySettings) => 
         axios.put('/settings/privacy', data),
       
       // Notifications
       getNotificationSettings: () => 
         axios.get('/settings/notifications'),
       updateNotificationSettings: (data: NotificationSettings) => 
         axios.put('/settings/notifications', data),
       
       // Preferences
       getUserPreferences: () => 
         axios.get('/settings/preferences'),
       updateUserPreferences: (data: UserPreferences) => 
         axios.put('/settings/preferences', data),
       
       // Blocked users
       getBlockedUsers: () => 
         axios.get('/settings/blocked'),
       blockUser: (userId: string, reason?: string) => 
         axios.post(`/settings/blocked/${userId}`, { reason }),
       unblockUser: (userId: string) => 
         axios.delete(`/settings/blocked/${userId}`),
     },
   };
   ```

3. **Заменить mock вызовы в страницах:**
   - В каждой странице найти `// TODO: Replace with actual API call`
   - Заменить mock код на вызов `api.settings.*`

## 🎨 Дизайн система

Используются готовые компоненты:
- `<Card>` - карточки
- `<Button>` - кнопки с вариантами (primary, outline)
- Toggle switches - inline CSS (можно вынести в компонент)
- Icons - из `lucide-react`

**Цвета (TailwindCSS):**
- `neon-purple` - основной акцент (active states)
- `neon-blue` - вторичный акцент
- `arena-dark` - тёмный фон
- `arena-border` - границы

## 🔐 Security Features

- **Cooldowns:** username (3 дня), avatar/banner/gender (7 дней)
- **Confirmations:** удаление аккаунта, очистка истории
- **Validation:** в будущем добавить на backend
- **2FA:** подготовлено UI, нужен backend

## 📱 Responsive

Layout адаптивный:
- Desktop: sidebar слева
- Mobile: можно добавить tabs или accordion (TODO)

## 🐛 Known Issues

1. Mock данные - нужно подключить реальный API
2. Нет валидации форм (добавить Zod или react-hook-form)
3. Нет автосохранения
4. Нет индикатора несохранённых изменений
5. Mobile navigation для settings нужно улучшить

## 📚 Документация

Полная документация в файле: `SETTINGS_SYSTEM.md`

## 🎉 Ready to use!

Система настроек полностью готова на фронтенде. Осталось только подключить backend API! 🚀
