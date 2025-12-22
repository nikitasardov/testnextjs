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
yarn install
```

**Примечание:** Проект использует Yarn. Если у вас установлен только npm,
установите Yarn: `npm install -g yarn`

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и заполните реальными значениями:

```bash
cp .env.example .env
```

Откройте `.env` и замените значения на реальные:

```
NEXT_PUBLIC_SUPABASE_URL=ваш-url-проекта
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-ключ
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-ключ
```

**Как получить эти значения:**

### Шаг 1: Вход в Supabase Dashboard
1. Откройте браузер и перейдите на [https://app.supabase.com](https://app.supabase.com)
2. Войдите в свою учетную запись Supabase (или зарегистрируйтесь, если у вас еще нет аккаунта)

### Шаг 2: Выбор проекта
1. На главной странице (Dashboard) вы увидите список ваших проектов
2. Кликните на проект, для которого хотите получить ключи API

### Шаг 3: Переход в настройки API
1. В левом боковом меню найдите иконку **"Settings"** (⚙️ Настройки) внизу списка
2. Кликните на **"Settings"**, откроется выпадающее меню
3. В выпадающем меню выберите пункт **"API"**

### Шаг 4: Получение Project URL
1. На странице API Settings в самом верху вы увидите секцию **"Project URL"**
2. Скопируйте значение из поля (обычно выглядит как `https://xxxxx.supabase.co`)
3. Вставьте его в `.env` файл как значение `NEXT_PUBLIC_SUPABASE_URL`

### Шаг 5: Получение anon public ключа
1. Прокрутите страницу вниз до секции **"Project API keys"** (Ключи API проекта)
2. Вы увидите несколько ключей, первый из них - это **"anon"** или **"anon public"** ключ
3. Рядом с ключом есть кнопка с иконкой копирования (📋) или кнопка **"Reveal"** (Показать), если ключ скрыт
4. Кликните на кнопку, чтобы показать ключ, затем скопируйте его
5. Вставьте его в `.env` файл как значение `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Шаг 6: Получение service_role ключа
1. В той же секции **"Project API keys"** прокрутите немного ниже
2. Найдите ключ с названием **"service_role"** (он обычно находится под ключом "anon")
3. Рядом с ним также есть кнопка **"Reveal"** (Показать) - кликните на неё
4. ⚠️ **Внимание:** Supabase может показать предупреждение о том, что этот ключ имеет расширенные привилегии - это нормально
5. Скопируйте ключ `service_role` (он длиннее, чем anon ключ)
6. Вставьте его в `.env` файл как значение `SUPABASE_SERVICE_ROLE_KEY`

### Визуальная структура страницы API Settings:
```
┌─────────────────────────────────────┐
│ Project URL                         │
│ https://xxxxx.supabase.co           │ ← Скопировать
├─────────────────────────────────────┤
│ ... другие настройки ...            │
├─────────────────────────────────────┤
│ Project API keys                    │
│                                     │
│ anon public                         │
│ eyJhbGc... (скрыт) [Reveal]        │ ← Скопировать
│                                     │
│ service_role                        │
│ eyJhbGc... (скрыт) [Reveal]        │ ← Скопировать
└─────────────────────────────────────┘
```

**ВАЖНО:** 
- `SUPABASE_SERVICE_ROLE_KEY` используется только на сервере для доступа к Admin API
- Никогда не используйте этот ключ в клиентском коде (в браузере)
- Этот ключ обходит все политики безопасности Row Level Security (RLS)
- Не коммитьте `.env` файл в git - он содержит секретные ключи

### 3. Запуск в режиме разработки

```bash
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Команды

```bash
# Разработка
yarn dev             # Запустить dev сервер

# Линтинг (проверка кода)
yarn lint            # Проверить код на ошибки
yarn lint:fix        # Автоматически исправить ошибки

# Сборка для продакшена
yarn build           # Собрать проект
yarn start           # Запустить собранное приложение
```

## Сборка для продакшена

### 1. Сборка проекта

```bash
yarn build
```

Эта команда:
- Проверит код на ошибки TypeScript
- Оптимизирует код
- Создаст статические файлы
- Подготовит серверное приложение

Результат будет в папке `.next/`.

### 2. Запуск в продакшене

```bash
yarn start
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
   - `SUPABASE_SERVICE_ROLE_KEY` (для работы страницы пользователей)
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
yarn install

# Создаём .env файл
cp .env.example .env
# Заполняем реальными значениями в .env
```

2. **Сборка:**
```bash
yarn build
```

3. **Запуск без PM2:**
```bash
yarn start
```

4. **Запуск с PM2 (рекомендуется):**
```bash
# Установка PM2
npm install -g pm2

# Запуск приложения через PM2
pm2 start yarn --name "nextjs-app" -- start

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
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Этап продакшена
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["yarn", "start"]
```

### Сборка и запуск:

```bash
# Сборка образа
docker build -t nextjs-app .

# Запуск контейнера
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
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
