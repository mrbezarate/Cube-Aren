 # UI/UX Navigation Improvement Plan

## Underground Arena - актуальный план навигации

**Дата актуализации:** 5 июля 2026  
**Статус:** план реализации, код еще не изменен по этому документу  
**Цель:** упростить верхнюю навигацию, разделить публичные и личные разделы, добавить удобную мобильную навигацию и безопасно вывести `/dashboard` из основного UX.

---

## 1. Текущее состояние проекта

### 1.1. Что уже есть в коде

**Глобальный shell**

- `frontend/src/app/layout.tsx` рендерит только `Navbar` и `main`.
- `frontend/src/components/ui/Navbar.tsx` содержит сразу все: публичные ссылки, `Создать`, `Кабинет`, баланс, профиль, logout и мобильное hamburger-menu.
- Отдельных `Sidebar`, `BottomTabBar`, `ProfileDropdown`, `NotificationDropdown` сейчас нет.

**UI-компоненты**

Есть:

- `Button.tsx`
- `Card.tsx`
- `Badge.tsx`
- `Modal.tsx`
- `GenderIcon.tsx`
- `Navbar.tsx`

Нужно создать:

- `Input.tsx`
- `Dropdown.tsx`
- `Tabs.tsx`
- `Avatar.tsx`
- `Sidebar.tsx`
- `BottomTabBar.tsx`
- `ProfileDropdown.tsx`
- `NotificationDropdown.tsx` или временный placeholder, пока нет API уведомлений

**Страницы**

Есть:

| Route | Статус | Комментарий |
| --- | --- | --- |
| `/` | есть | Сейчас landing + турниры, не feed |
| `/tournaments` | есть | Список турниров |
| `/tournaments/[id]` | есть | Детали турнира |
| `/community` | есть | Mock-доски, не реальные посты |
| `/leaderboard` | есть | Рейтинг игроков/команд |
| `/chat` | есть | Чат |
| `/friends` | есть | Друзья/подписки |
| `/teams` | есть | Включает блок "Мои кланы" для авторизованных |
| `/profile/[id]` | есть | Публичный профиль, без dashboard-вкладок |
| `/profile/edit` | есть | Редирект/переход к настройкам профиля |
| `/settings/profile` | есть | Настройки профиля |
| `/settings/privacy` | есть | Приватность |
| `/settings/account` | есть | Аккаунт |
| `/settings/notifications` | есть | Настройки уведомлений |
| `/settings/preferences` | есть | Предпочтения |
| `/create` | есть | Создание турнира |
| `/dashboard` | есть | Старый личный кабинет, пока нельзя удалять |

Нет:

| Route | Нужное действие |
| --- | --- |
| `/wallet` | создать отдельную страницу кошелька |
| `/saved` | создать отдельную страницу сохраненных турниров |
| `/notifications` | не создавать в первом этапе, пока нет API списка уведомлений |
| `/teams/my` | не использовать, такого route нет |
| `/community/[id]` | будущая работа вместе с backend для постов |

### 1.2. API, на который можно опираться

Доступно на frontend через `frontend/src/lib/api.ts`:

| Данные | Frontend helper | Backend endpoint |
| --- | --- | --- |
| Профиль | `api.users.getFullProfile(id)` | `GET /users/:id/profile` |
| Кошелек, кратко | `api.users.getWallet()` | `GET /users/me/wallet` |
| Баланс | `api.wallet.getBalance()` | `GET /wallet/balance` |
| Транзакции | `api.wallet.getTransactions()` | `GET /wallet/transactions` |
| Демо-пополнение | `api.wallet.deposit(amount)` | `POST /wallet/deposit` |
| Сохраненные турниры | `api.tournaments.getSaved()` | `GET /tournaments/saved` |
| Сохранить турнир | `api.tournaments.save(id)` | `POST /tournaments/:id/save` |
| Убрать из сохраненных | `api.tournaments.unsave(id)` | `DELETE /tournaments/:id/save` |
| Мои ставки | `api.bets.getMy()` | `GET /bets/me` |
| Мои команды | `api.teams.getMy()` | `GET /teams/my` |
| Чаты | `api.chat.getRooms()` | `GET /chat/rooms` |
| Друзья | `api.friends.getFriends()` | `GET /friends/list` |
| Входящие запросы/подписки | `api.friends.getIncoming()` | `GET /friends/incoming` |
| Настройки | `api.settings.*` | `GET/PUT /settings/*` |

Не доступно и не должно блокировать первый этап:

- `GET /feed`
- `GET /community/posts`
- `GET /community/posts/:id`
- `POST /community/posts`
- `POST /community/posts/:id/comments`
- API списка пользовательских уведомлений

---

## 2. Целевая архитектура навигации

### 2.1. Top Navbar

Navbar должен быть одинаково понятным для гостей и авторизованных пользователей.

**Desktop/tablet:**

```text
[Logo]  Турниры  Сообщество  Рейтинг                         [right area]
```

Публичные пункты:

| Label | Route |
| --- | --- |
| Турниры | `/tournaments` |
| Сообщество | `/community` |
| Рейтинг | `/leaderboard` |

Правая часть для гостя:

- `Войти` -> `/auth/login`
- `Регистрация` -> `/auth/register`

Правая часть для авторизованного:

- баланс `500 CR`
- уведомления: icon button, в первом этапе можно показать dropdown-placeholder без отдельной страницы
- avatar -> `ProfileDropdown`

Что убрать из navbar:

- `Создать`
- `Кабинет`
- прямой logout button рядом с профилем
- личные разделы (`Чат`, `Друзья`, `Настройки`, `Сохраненное`)

### 2.2. Sidebar для авторизованных пользователей

Sidebar показывается только для авторизованных пользователей на desktop/tablet.

```text
Главная        -> /
Чат            -> /chat
Друзья         -> /friends
Мои команды    -> /teams
Сохраненное    -> /saved        (после создания route)
Настройки      -> /settings/profile

[Создать турнир] -> /create      (только organizer/admin)
```

Правила:

- На `lg` и шире sidebar открыт.
- На `md` можно использовать компактный icon-only режим, если это не усложняет первый релиз.
- На `<768px` sidebar скрыт полностью, его заменяет `BottomTabBar`.
- До появления `/saved` пункт `Сохраненное` не должен вести на 404. Либо создать `/saved` в том же этапе, либо временно не показывать пункт.
- Не использовать `/teams/my`: такого frontend route сейчас нет.

### 2.3. Bottom Tab Bar для мобильных

Показывается только на `<768px`, fixed bottom.

**Для гостя:**

| Label | Route |
| --- | --- |
| Главная | `/` |
| Турниры | `/tournaments` |
| Сообщество | `/community` |
| Рейтинг | `/leaderboard` |
| Войти | `/auth/login` |

**Для авторизованного:**

| Label | Route |
| --- | --- |
| Главная | `/` |
| Турниры | `/tournaments` |
| Чат | `/chat` |
| Друзья | `/friends` |
| Профиль | `/profile/{user.id}` |

Правила:

- Максимум 5 пунктов.
- Активный пункт определяется через `usePathname`.
- Для `Профиль` active state должен срабатывать на `/profile/*` и `/settings/*`.
- На мобильном layout должен иметь bottom padding, чтобы tab bar не перекрывал контент.

### 2.4. Profile Dropdown

Открывается по клику на avatar в navbar.

Пункты:

| Label | Route/action |
| --- | --- |
| Мой профиль | `/profile/{user.id}` |
| Кошелек | `/wallet` после создания страницы |
| Настройки | `/settings/profile` |
| Выйти | `logout()` + redirect `/` |

До создания `/wallet` пункт можно временно скрыть или вести на `/dashboard` нельзя: это продлит старый UX.

### 2.5. Notification Dropdown

В первом этапе не создавать отдельную систему уведомлений.

Минимально допустимый вариант:

- icon button в navbar;
- dropdown с текстом "Уведомлений пока нет";
- без ссылки на `/notifications`, потому что route и API списка уведомлений отсутствуют.

Если нужен badge, использовать только данные, которые уже есть локально или реально загружаются через существующий API. Не хардкодить `(3)`.

---

## 3. Дизайн-система и токены

### 3.1. Актуальные Tailwind tokens

Новые компоненты должны использовать текущие токены из `frontend/tailwind.config.ts`:

```text
bg-primary
bg-secondary
bg-tertiary
bg-elevated

text-primary
text-secondary
text-tertiary
text-muted

accent-primary
accent-primary-hover
accent-secondary
accent-success
accent-warning
accent-danger

border-subtle
border-default
border-strong
```

Legacy aliases, которые сейчас есть и могут оставаться во время миграции:

```text
arena-dark
arena-card
arena-border
font-orbitron
font-space
```

Не использовать в новых компонентах:

```text
neon-purple
neon-blue
neon-gold
neon-green
neon-red
glass-panel
shadow-neon-*
```

Причина: эти классы массово встречаются в старых страницах, но не определены как актуальные tokens в Tailwind config. При касании старых страниц их нужно постепенно заменять на `accent-*`, `bg-*`, `text-*`, `border-*` и `.glass`.

### 3.2. Базовые компоненты, которые надо добавить первыми

#### `Input.tsx`

Назначение: единый input/textarea для форм.

Минимальные props:

- `label?: string`
- `error?: string`
- `hint?: string`
- `icon?: React.ReactNode`
- `as?: 'input' | 'textarea'`
- `size?: 'sm' | 'md' | 'lg'`

#### `Dropdown.tsx`

Назначение: menu dropdown для профиля/уведомлений и простых action menus.

Минимальные части:

- `Dropdown`
- `DropdownItem`
- `DropdownDivider`

Не делать select dropdown в первом релизе, если он не нужен для навигации.

#### `Tabs.tsx`

Назначение: вкладки профиля, кошелька, сохраненного.

Минимальные части:

- controlled mode: `value`, `onValueChange`
- `TabsList`
- `TabsTrigger`
- `TabsContent`

#### `Avatar.tsx`

Назначение: единый avatar в navbar, списках, профиле.

Минимальные props:

- `src?: string`
- `alt: string`
- `fallback?: string`
- `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `status?: 'online' | 'offline'`

---

## 4. Порядок реализации

### Этап 0. Подготовка дизайн-системы

**Цель:** создать компоненты, на которых будут собраны навигация и новые страницы.

Файлы:

- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Dropdown.tsx`
- `frontend/src/components/ui/Tabs.tsx`
- `frontend/src/components/ui/Avatar.tsx`

Acceptance criteria:

- компоненты используют актуальные токены, не `neon-*`;
- компоненты типизированы;
- работают controlled/uncontrolled сценарии там, где это нужно;
- старые страницы не ломаются.

### Этап 1. Navbar + ProfileDropdown

**Цель:** разгрузить верхнюю навигацию без изменения маршрутов личного кабинета.

Файлы:

- `frontend/src/components/ui/Navbar.tsx`
- `frontend/src/components/ui/ProfileDropdown.tsx`
- `frontend/src/components/ui/NotificationDropdown.tsx` или временный локальный блок внутри `Navbar`

Изменения:

- оставить в navbar только `/tournaments`, `/community`, `/leaderboard`;
- убрать `/create` и `/dashboard` из верхних ссылок;
- заменить прямой logout на пункт dropdown;
- добавить avatar через `Avatar.tsx`;
- не добавлять ссылки на несуществующие routes.

Acceptance criteria:

- гость видит публичные ссылки и auth buttons;
- авторизованный видит баланс, уведомления-placeholder, avatar;
- `/dashboard` больше не показывается в navbar;
- `/create` больше не показывается в navbar.

### Этап 2. Sidebar для desktop/tablet

**Цель:** вынести личные разделы в отдельную навигацию.

Файлы:

- `frontend/src/components/ui/Sidebar.tsx`
- `frontend/src/app/layout.tsx`

Изменения:

- sidebar показывается только авторизованным;
- пункты: `/`, `/chat`, `/friends`, `/teams`, `/settings/profile`;
- пункт `/saved` добавлять только если `/saved` уже создан в этом же PR/изменении;
- `/create` показывать отдельной кнопкой только `organizer` и `admin`;
- layout должен учитывать ширину sidebar на desktop;
- на mobile sidebar скрыт.

Acceptance criteria:

- публичные страницы не получают пустую боковую панель для гостей;
- на desktop личные разделы доступны без hamburger-menu;
- на mobile sidebar не занимает место.

### Этап 3. BottomTabBar для mobile

**Цель:** сделать мобильную навигацию без перегруженного hamburger-menu.

Файлы:

- `frontend/src/components/ui/BottomTabBar.tsx`
- `frontend/src/app/layout.tsx`
- возможно `frontend/src/components/ui/Navbar.tsx`

Изменения:

- fixed bottom nav на `<768px`;
- 5 пунктов максимум;
- для auth использовать `/profile/{user.id}`;
- добавить `pb-*` в mobile layout, чтобы контент не перекрывался.

Acceptance criteria:

- mobile nav работает для гостя и auth;
- активный пункт подсвечивается;
- нет дублирования всех личных ссылок в navbar hamburger-menu.

### Этап 4. Создать `/wallet`

**Цель:** вынести кошелек из `/dashboard`.

Файлы:

- `frontend/src/app/wallet/page.tsx`
- при необходимости `frontend/src/middleware.ts`
- при необходимости `frontend/src/components/ui/ProfileDropdown.tsx`

Данные:

- баланс: `api.wallet.getBalance()` или `api.users.getWallet()`;
- транзакции: `api.wallet.getTransactions()`;
- демо-пополнение: `api.wallet.deposit(amount)`.

UI:

- текущий баланс;
- таблица/список транзакций;
- фильтр по типу транзакции можно делать client-side на первом этапе;
- кнопка демо-пополнения, если она остается в продуктовой логике.

Acceptance criteria:

- `/wallet` не 404;
- страница требует авторизацию;
- dropdown может безопасно ссылаться на `/wallet`;
- wallet-блок в `/dashboard` больше не является единственным доступом к транзакциям.

### Этап 5. Создать `/saved`

**Цель:** вынести сохраненные турниры из `/dashboard`.

Файлы:

- `frontend/src/app/saved/page.tsx`
- `frontend/src/components/ui/Sidebar.tsx`
- при необходимости `frontend/src/middleware.ts`

Данные:

- `api.tournaments.getSaved()`;
- `api.tournaments.unsave(id)`.

UI:

- список сохраненных турниров;
- empty state;
- фильтры client-side: все, открытые, активные, завершенные;
- поиск можно добавить только если не растягивает этап.

Acceptance criteria:

- `/saved` не 404;
- sidebar может безопасно показывать пункт `Сохраненное`;
- удаление из сохраненных обновляет список без reload.

### Этап 6. Profile Hub

**Цель:** перенести смысловые части `/dashboard` в профиль и отдельные страницы.

Файлы:

- `frontend/src/app/profile/[id]/page.tsx`
- возможно новые локальные компоненты в `frontend/src/components/profile/`

Вкладки:

| Tab | Доступ | Источник данных |
| --- | --- | --- |
| Обзор | все | `api.users.getFullProfile(id)` |
| Статистика | все | уже есть в profile payload |
| Команды | все | `profile.teams` |
| Турниры | только свой профиль на первом этапе | `api.tournaments.getAll({ ... })` или будущий точный endpoint |
| Ставки | только свой профиль | `api.bets.getMy()` |

Важно:

- Не показывать приватные ставки чужим пользователям.
- Не переносить wallet во вкладку профиля: для него создается `/wallet`.
- Если нет точного API "мои турниры", временно можно использовать текущую dashboard-логику, но отметить это как технический долг.

Acceptance criteria:

- свой профиль заменяет основные сценарии `/dashboard`;
- чужой профиль не показывает приватные данные;
- кнопка настроек видна только владельцу профиля.

### Этап 7. Безопасный вывод `/dashboard`

**Цель:** убрать старый route из UX без поломки редиректов.

Сначала заменить все переходы:

- `frontend/src/components/ui/Navbar.tsx`
- `frontend/src/app/auth/login/page.tsx`
- `frontend/src/app/auth/register/page.tsx`
- `frontend/src/app/auth/callback/page.tsx`
- `frontend/src/components/onboarding/OnboardingModal.tsx`
- `frontend/src/middleware.ts`

Новые правила:

- после login/register/callback вести на `/profile/{user.id}`, если id доступен;
- если id недоступен, вести на `/`;
- `/dashboard` оставить как redirect на `/profile/{user.id}` для auth;
- для гостя `/dashboard` redirect на `/auth/login`.

Удалять `frontend/src/app/dashboard/page.tsx` только после того, как:

- `/wallet` готов;
- `/saved` готов;
- profile hub покрывает ставки/турниры;
- все ссылки и redirects обновлены.

Acceptance criteria:

- `rg "/dashboard" frontend/src` показывает только intentional redirect или ничего;
- прямой заход на `/dashboard` не ломает пользователя;
- старый dashboard не остается в основной навигации.

### Этап 8. Будущие улучшения, не блокирующие навигацию

Эти задачи не входят в первый проход навигации:

- превратить `/` в персональный feed;
- сделать реальные community posts вместо mock-досок;
- добавить `/community/[id]`;
- добавить backend для `Post`, `Comment`, `PostReaction`;
- добавить полноценный центр уведомлений и `/notifications`.

---

## 5. Middleware и защита routes

Сейчас `frontend/src/middleware.ts` защищает только:

```ts
const protectedRoutes = ['/dashboard', '/create'];
```

После добавления новых личных страниц список должен быть пересмотрен.

Кандидаты на protected routes:

```ts
const protectedRoutes = [
  '/dashboard',
  '/create',
  '/chat',
  '/friends',
  '/wallet',
  '/saved',
  '/settings',
];
```

Примечание: `/profile/[id]`, `/tournaments`, `/community`, `/leaderboard`, `/teams` должны оставаться публичными, если продуктово не решено иначе.

---

## 6. Правила верстки

- Не вкладывать карточки в карточки без необходимости.
- Использовать `Button`, `Card`, `Badge`, `Input`, `Dropdown`, `Tabs`, `Avatar`.
- Для повторяющихся карточек задавать стабильную высоту или grid rows, чтобы сетка не прыгала.
- На mobile проверять, что bottom tab не перекрывает кнопки и нижний контент.
- Не использовать hero-scale типографику в dashboard/sidebar/dropdown.
- Новые элементы делать на текущих токенах `bg-*`, `text-*`, `accent-*`, `border-*`.
- При касании старых страниц заменять `neon-*` постепенно, без отдельного массового refactor в навигационном PR.

---

## 7. Проверка после реализации

Минимальные проверки:

```bash
cd frontend
npm run lint
npm run build
```

Ручные сценарии:

1. Гость на desktop видит `Турниры`, `Сообщество`, `Рейтинг`, `Войти`, `Регистрация`.
2. Гость на mobile видит bottom tabs без личных auth-разделов.
3. Авторизованный пользователь на desktop видит navbar + sidebar.
4. Авторизованный пользователь на mobile видит bottom tabs.
5. Organizer/admin видит быстрый вход в `/create`, participant не видит.
6. `/wallet` открывается и показывает баланс/транзакции.
7. `/saved` открывается и показывает сохраненные турниры.
8. `/dashboard` больше не доступен из навигации.
9. Прямой заход на `/dashboard` корректно редиректит.
10. Logout из profile dropdown очищает auth state и ведет на `/`.

---

## 8. Короткий итог

Сначала создаем недостающие UI primitives. Затем разгружаем navbar и добавляем sidebar/bottom tabs. После этого выносим `/wallet` и `/saved`, превращаем профиль в hub и только в конце убираем `/dashboard` из пользовательского пути через безопасный redirect.

Ключевой принцип: не ссылаться на несуществующие routes и не удалять `/dashboard`, пока его данные не перенесены в новые места.
