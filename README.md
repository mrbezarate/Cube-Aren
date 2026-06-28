# 🎮 Underground Arena — Документация & Руководство по хостингу

Underground Arena — это селф-хостинг платформа подпольных игровых турниров с системой интерактивных ставок на внутренней валюте (Credits, CR). 

---

## 🚀 Вариант 1: Локальный хостинг (Локальный запуск)

Для локального запуска вам понадобится установленный **Docker** и **Docker Compose**.

### Шаги для запуска:
1. Перейдите в корневую директорию проекта.
2. Скопируйте шаблон переменных окружения:
   ```bash
   cp .env.example .env
   ```
3. Запустите сборку и старт контейнеров:
   ```bash
   docker-compose up -d --build
   ```
   *Флаг `-d` запустит контейнеры в фоновом (detached) режиме.*

### Как проверить статус и логи локально?
- **Проверка запущенных контейнеров**:
  ```bash
  docker ps
  ```
  Вы должны увидеть 4 запущенных контейнера: `arena_nginx`, `arena_frontend`, `arena_backend` и `arena_postgres`.
  
- **Просмотр логов бэкенда**:
  ```bash
  docker logs -f arena_backend
  ```
  
- **Просмотр логов всех сервисов**:
  ```bash
  docker-compose logs -f
  ```

- **Адреса локальных сервисов**:
  - Фронтенд (Next.js): [http://localhost](http://localhost) (порт `80`)
  - Документация бэкенда (Swagger): [http://localhost/api/docs](http://localhost/api/docs)
  - Прямое подключение к бэкенду: [http://localhost:3001](http://localhost:3001)
  - Подключение к БД PostgreSQL: `localhost:5432` (пользователь `arena_user`, пароль `arena_secret_password`)

---

## 🌐 Вариант 2: Хостинг на удаленном сервере (VPS/VDS)

Для размещения сайта в интернете рекомендуется арендовать VPS-сервер (например, на Ubuntu 22.04 LTS).

### Шаг 1: Подготовка VPS-сервера
Подключитесь к вашему серверу через SSH и обновите пакеты:
```bash
sudo apt update && sudo apt upgrade -y
```

Установите Docker и Docker Compose:
```bash
sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker
```

### Шаг 2: Настройка проекта на сервере
1. Перенесите файлы проекта на сервер (с помощью Git или `scp`).
2. Создайте файл `.env` в корневой папке проекта на сервере:
   ```bash
   nano .env
   ```
   **Важно изменить параметры для продакшена**:
   ```ini
   NODE_ENV=production
   DB_PASSWORD=придумайте_сложный_пароль_бд
   JWT_SECRET=укажите_случайную_строку_для_jwt
   JWT_REFRESH_SECRET=укажите_случайную_строку_для_refresh
   
   # Укажите адрес вашего домена или IP сервера
   FRONTEND_URL=http://yourdomain.com
   NEXT_PUBLIC_API_URL=http://yourdomain.com/api
   ```

3. Запустите проект в фоновом режиме:
   ```bash
   docker-compose up -d --build
   ```

### Шаг 3: Настройка домена и SSL-сертификата (HTTPS)
Чтобы сайт работал по безопасному протоколу `https://yourdomain.com`, вам понадобятся домен и бесплатный сертификат Let's Encrypt.

1. Установите Certbot на хост-машину:
   ```bash
   sudo apt install certbot -y
   ```
2. Остановите контейнер Nginx, чтобы освободить 80 порт для проверки:
   ```bash
   docker stop arena_nginx
   ```
3. Выпустите сертификат Let's Encrypt для вашего домена:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```
   *Сертификаты будут сохранены в директории `/etc/letsencrypt/live/yourdomain.com/`*
   
4. Обновите конфигурацию `nginx/nginx.conf` для поддержки SSL. Пример защищенного проксирования:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location /api/ {
           proxy_pass http://backend:3001;
           # ... standard headers ...
       }

       location / {
           proxy_pass http://frontend:3000;
           # ... standard headers ...
       }
   }
   ```
5. Пробросьте сертификаты внутрь контейнера Nginx, обновив `docker-compose.yml`:
   ```yaml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
       - /etc/letsencrypt:/etc/letsencrypt:ro
   ```
6. Снова запустите контейнеры:
   ```bash
   docker-compose up -d
   ```

---

## 🛠️ Мониторинг и обслуживание

### Как зайти внутрь базы данных и посмотреть таблицы?
Если вам нужно выполнить SQL-запросы напрямую:
```bash
docker exec -it arena_postgres psql -U arena_user -d underground_arena
```
В консоли psql вы можете вводить SQL-команды, например:
```sql
\dt              -- Показать все таблицы
SELECT * FROM users; -- Показать всех пользователей
```

### Как перезапустить отдельный сервис (например, только бэкенд)?
```bash
docker-compose restart backend
```

### Как применить изменения в коде?
Если вы обновили код фронтенда или бэкенда, пересоберите нужный контейнер:
```bash
docker-compose up -d --build backend
```
