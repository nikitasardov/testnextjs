# Next.js приложение с авторизацией

Это учебное приложение на Next.js с авторизацией через Supabase.

## Технологии

- **Next.js 16** - React фреймворк для продакшена
- **React 19** - Библиотека для создания UI
- **TypeScript** - Типизированный JavaScript
- **Material-UI** - Библиотека компонентов
- **Supabase** - Backend как сервис (база данных и авторизация)

## Начало работы

### 1. Установка зависимостей

```bash
npm install
# или
yarn install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и заполните реальными значениями:

```bash
cp .env.example .env
```

Откройте `.env` и замените значения на реальные:

```
NEXT_PUBLIC_SUPABASE_URL=ваш-url-проекта
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-ключ
```

**Как получить эти значения:**
1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в Settings → API
4. Скопируйте "Project URL" и "anon public" ключ

### 3. Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Команды

```bash
# Разработка
npm run dev          # Запустить dev сервер

# Линтинг (проверка кода)
npm run lint         # Проверить код на ошибки
npm run lint:fix     # Автоматически исправить ошибки

# Сборка для продакшена
npm run build        # Собрать проект
npm run start        # Запустить собранное приложение
```

## Сборка для продакшена

### 1. Сборка проекта

```bash
npm run build
```

Эта команда:
- Проверит код на ошибки TypeScript
- Оптимизирует код
- Создаст статические файлы
- Подготовит серверное приложение

Результат будет в папке `.next/`.

### 2. Запуск в продакшене

```bash
npm run start
```

Приложение будет доступно на порту 3000 (или на порту, указанном в переменной окружения `PORT`).

## Деплой на Vercel (Рекомендуется)

Vercel - это платформа от создателей Next.js, самая простая для деплоя.

### Быстрый деплой:

1. Зайдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите "New Project"
4. Подключите репозиторий с вашим кодом
5. В разделе "Environment Variables" добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Нажмите "Deploy"

**Готово!** Через несколько минут приложение будет доступно по адресу вида: `your-app.vercel.app`

### Автоматический деплой

Vercel автоматически деплоит приложения при каждом push в main ветку.

## Деплой на собственном сервере

### Требования:
- Node.js 20+ 
- PM2 (процесс-менеджер) - опционально

### Шаги:

1. **Подготовка сервера:**
```bash
# Клонируем репозиторий
git clone your-repo-url
cd your-app

# Устанавливаем зависимости
npm install

# Создаём .env файл
cp .env.example .env
# Заполняем реальными значениями в .env
```

2. **Сборка:**
```bash
npm run build
```

3. **Запуск без PM2:**
```bash
npm run start
```

4. **Запуск с PM2 (рекомендуется):**
```bash
# Установка PM2
npm install -g pm2

# Запуск приложения через PM2
pm2 start npm --name "nextjs-app" -- start

# Сохранение конфигурации для автозапуска
pm2 save
pm2 startup
```

PM2 будет:
- Автоматически перезапускать приложение при сбоях
- Сохранять логи
- Обеспечивать нулевое время простоя

### Настройка Nginx как reverse proxy:

Создайте файл `/etc/nginx/sites-available/your-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Настройка HTTPS (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker деплой (опционально)

### Dockerfile:

Создайте файл `Dockerfile` в корне проекта:

```dockerfile
# Этап сборки
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап продакшена
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### Сборка и запуск:

```bash
# Сборка образа
docker build -t nextjs-app .

# Запуск контейнера
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  nextjs-app
```

## Структура проекта

```
├── src/
│   ├── components/     # React компоненты
│   │   ├── AuthButton.tsx
│   │   └── AuthModal.tsx
│   ├── contexts/       # React контексты
│   │   └── AuthContext.tsx
│   ├── pages/          # Страницы Next.js
│   │   ├── api/        # API routes
│   │   ├── _app.tsx    # Главный компонент
│   │   └── index.tsx
│   ├── styles/         # Глобальные стили
│   └── utils/          # Утилиты
│       └── supabase.ts
├── public/             # Статические файлы
├── .env.example        # Пример переменных окружения
├── .gitignore          # Файлы для игнорирования в git
└── package.json
```

## Важные замечания

### Для продакшена:

1. **Никогда не коммитьте `.env` в git** - он содержит секретные ключи
2. **Используйте `.env.example`** как шаблон для других разработчиков
3. **Настройте CORS** в Supabase для вашего домена
4. **Включите Row Level Security** в таблицах Supabase
5. **Используйте HTTPS** в продакшене
6. **Настройте мониторинг** приложения

### Безопасность:

- Ключи Supabase начинающиеся с `NEXT_PUBLIC_` видны в браузере
- Не храните секретные ключи в клиентском коде
- Используйте серверные API routes для критичных операций

## Дополнительные ресурсы

- [Next.js документация](https://nextjs.org/docs)
- [Supabase документация](https://supabase.com/docs)
- [Material-UI документация](https://mui.com)
- [Vercel документация](https://vercel.com/docs)

## Лицензия

Учебный проект для изучения Next.js, React и TypeScript.
