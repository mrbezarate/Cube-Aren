# 🎯 Settings System - README

## 📌 Краткое описание

Реализована полноценная система настроек для Underground Arena с 5 вкладками:

1. **Профиль** - редактирование профиля
2. **Конфиденциальность** - приватность и блокировки  
3. **Аккаунт** - безопасность и OAuth
4. **Уведомления** - управление уведомлениями
5. **Предпочтения** - интерфейс и контент

## 🚀 Быстрый старт

### 1. Применить миграцию БД

```bash
# Windows (PowerShell)
$env:PGPASSWORD="your_password"
psql -U postgres -d underground_arena -f backend/src/database/migrations/003_add_user_settings_tables.sql

# Linux/Mac
PGPASSWORD=your_password psql -U postgres -d underground_arena -f backend/src/database/migrations/003_add_user_settings_tables.sql
```

### 2. Запустить приложение

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Открыть настройки

Перейти по адресу: http://localhost:3000/settings/profile

## 📁 Что создано

### Frontend (9 файлов)
```
✅ src/app/settings/layout.tsx
✅ src/app/settings/profile/page.tsx
✅ src/app/settings/privacy/page.tsx
✅ src/app/settings/account/page.tsx
✅ src/app/settings/notifications/page.tsx
✅ src/app/settings/preferences/page.tsx
✅ src/app/profile/edit/page.tsx (redirect)
✅ src/types/index.ts (обновлён)
✅ src/components/ui/Button.tsx (добавлен 'outline' вариант)
```

### Backend (5 файлов)
```
✅ src/entities/privacy-settings.entity.ts
✅ src/entities/notification-settings.entity.ts
✅ src/entities/user-preferences.entity.ts
✅ src/entities/blocked-user.entity.ts
✅ src/database/migrations/003_add_user_settings_tables.sql
```

### Документация (4 файла)
```
✅ SETTINGS_SYSTEM.md - Детальная документация
✅ SETTINGS_QUICKSTART.md - Быстрый старт
✅ SETTINGS_STRUCTURE.txt - Визуальная структура
✅ SETTINGS_SUMMARY.md - Итоговая сводка
```

## ⚠️ Важно! Mock данные

**Все страницы настроек используют mock данные!**

Чтобы всё заработало, нужно:

### Шаг 1: Создать Backend Controllers

```typescript
// backend/src/modules/settings/settings.controller.ts

import { Controller, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Privacy
  @Get('privacy')
  async getPrivacySettings(@CurrentUser() user) {
    return this.settingsService.getPrivacySettings(user.id);
  }

  @Put('privacy')
  async updatePrivacySettings(@CurrentUser() user, @Body() data) {
    return this.settingsService.updatePrivacySettings(user.id, data);
  }

  // Notifications
  @Get('notifications')
  async getNotificationSettings(@CurrentUser() user) {
    return this.settingsService.getNotificationSettings(user.id);
  }

  @Put('notifications')
  async updateNotificationSettings(@CurrentUser() user, @Body() data) {
    return this.settingsService.updateNotificationSettings(user.id, data);
  }

  // Preferences
  @Get('preferences')
  async getUserPreferences(@CurrentUser() user) {
    return this.settingsService.getUserPreferences(user.id);
  }

  @Put('preferences')
  async updateUserPreferences(@CurrentUser() user, @Body() data) {
    return this.settingsService.updateUserPreferences(user.id, data);
  }

  // Blocked users
  @Get('blocked')
  async getBlockedUsers(@CurrentUser() user) {
    return this.settingsService.getBlockedUsers(user.id);
  }

  @Post('blocked/:userId')
  async blockUser(@CurrentUser() user, @Param('userId') userId: string, @Body() body) {
    return this.settingsService.blockUser(user.id, userId, body.reason);
  }

  @Delete('blocked/:userId')
  async unblockUser(@CurrentUser() user, @Param('userId') userId: string) {
    return this.settingsService.unblockUser(user.id, userId);
  }
}
```

### Шаг 2: Обновить API клиент

```typescript
// frontend/src/lib/api.ts

export const api = {
  // ... existing methods

  settings: {
    // Privacy
    getPrivacySettings: async () => {
      const response = await axios.get('/settings/privacy');
      return response.data;
    },
    updatePrivacySettings: async (data: PrivacySettings) => {
      const response = await axios.put('/settings/privacy', data);
      return response.data;
    },

    // Notifications
    getNotificationSettings: async () => {
      const response = await axios.get('/settings/notifications');
      return response.data;
    },
    updateNotificationSettings: async (data: NotificationSettings) => {
      const response = await axios.put('/settings/notifications', data);
      return response.data;
    },

    // Preferences
    getUserPreferences: async () => {
      const response = await axios.get('/settings/preferences');
      return response.data;
    },
    updateUserPreferences: async (data: UserPreferences) => {
      const response = await axios.put('/settings/preferences', data);
      return response.data;
    },

    // Blocked users
    getBlockedUsers: async () => {
      const response = await axios.get('/settings/blocked');
      return response.data;
    },
    blockUser: async (userId: string, reason?: string) => {
      const response = await axios.post(`/settings/blocked/${userId}`, { reason });
      return response.data;
    },
    unblockUser: async (userId: string) => {
      const response = await axios.delete(`/settings/blocked/${userId}`);
      return response.data;
    },
  },
};
```

### Шаг 3: Заменить mock данные

В каждой странице найти и заменить:
```typescript
// ❌ Было:
// TODO: Replace with actual API call
// const data = await api.settings.getPrivacySettings();
setTimeout(() => setLoading(false), 500);

// ✅ Стало:
const data = await api.settings.getPrivacySettings();
setSettings(data);
setLoading(false);
```

## 🎨 Примеры использования

### Перейти на страницу настроек

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Redirect to settings
router.push('/settings/profile');
router.push('/settings/privacy');
router.push('/settings/account');
```

### Обновить настройки

```typescript
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Update privacy settings
const updatePrivacy = async () => {
  try {
    await api.settings.updatePrivacySettings({
      profileVisibility: 'friends',
      canMessageMe: 'friends',
      // ... other settings
    });
    toast.success('Настройки обновлены!');
  } catch (error) {
    toast.error('Ошибка сохранения');
  }
};
```

## 🔒 Безопасность

### Cooldown механизмы
- **Username:** 3 дня
- **Avatar/Banner/Gender:** 7 дней

### Подтверждения
- Удаление аккаунта (soft delete 30 дней)
- Очистка истории
- Блокировка пользователей

### Валидация
- Email формат
- Пароль (минимум 8 символов)
- URL изображений

## 📊 База данных

### Таблицы
```sql
privacy_settings         -- Настройки конфиденциальности
notification_settings    -- Настройки уведомлений
user_preferences         -- Пользовательские предпочтения
blocked_users            -- Заблокированные пользователи
```

### Связи
```
users (1) ←→ (1) privacy_settings
users (1) ←→ (1) notification_settings
users (1) ←→ (1) user_preferences
users (1) ←→ (*) blocked_users
```

## 🎯 Roadmap

### Фаза 1: Core (Текущая)
- ✅ UI всех страниц настроек
- ✅ Database entities
- ✅ Migration файл
- ✅ TypeScript типы

### Фаза 2: Integration
- ⏳ Backend controllers/services
- ⏳ API integration
- ⏳ Real data loading
- ⏳ Form validation

### Фаза 3: Polish
- ⏳ Auto-save (debounced)
- ⏳ Unsaved changes warning
- ⏳ Error handling
- ⏳ Loading optimizations

### Фаза 4: Advanced
- ⏳ Export/Import settings
- ⏳ Settings search
- ⏳ Keyboard shortcuts
- ⏳ Settings history (undo/redo)

## 🐛 Troubleshooting

### Problem: "Cannot find module '@/types'"
**Solution:** Проверьте tsconfig.json:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Problem: "Button variant 'outline' does not exist"
**Solution:** Вариант 'outline' уже добавлен в Button.tsx. Перезапустите dev server.

### Problem: "Migration already applied"
**Solution:** Это нормально. Миграция применяется один раз.

### Problem: "Mock data not loading"
**Solution:** Проверьте console.log в браузере. Mock данные загружаются с задержкой 500ms.

## 📞 Поддержка

Если возникли вопросы, смотрите:
- `SETTINGS_SYSTEM.md` - полная документация
- `SETTINGS_QUICKSTART.md` - быстрый старт
- `SETTINGS_STRUCTURE.txt` - визуальная структура

## ✨ Credits

**Created:** 2 июля 2026  
**By:** Kiro AI Assistant  
**Version:** 1.0.0  
**Status:** ✅ Frontend Ready, ⏳ Backend Integration Pending

---

**Готово к использованию!** 🚀

Все UI компоненты работают, осталось только подключить backend API.
