# Next.js приложение с авторизацией

Это учебное приложение на Next.js с авторизацией через Supabase.

## Технологии

- **Next.js 16** - React фреймворк для продакшена
- **React 19** - Библиотека для создания UI
- **TypeScript** - Типизированный JavaScript
- **Material-UI** - Библиотека компонентов
- **Supabase** - Backend как сервис (база данных и авторизация)
- **VseGPT API** - Интеграция с LLM для генерации подсказок в игре 15-puzzle

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

### 2.1. Настройка базы данных для игр

Для работы функционала сохранения игр необходимо создать таблицу в Supabase:

1. Откройте Supabase Dashboard и выберите ваш проект
2. Перейдите в раздел **SQL Editor** (в левом меню)
3. Создайте новый запрос и скопируйте содержимое файла `supabase-migrations/create_game_configs_table.sql`
4. Выполните SQL запрос (нажмите кнопку "Run" или `Ctrl+Enter`)

Это создаст таблицу `game_configs` с необходимыми политиками безопасности (RLS), которая будет хранить конфигурации игр для каждого пользователя.

### 2.2. Настройка AI-функциональности (опционально)

Для работы AI-подсказок в игре 15-puzzle необходимо настроить переменные окружения:

```
VSEGPT_API_KEY=ваш-api-ключ
VSEGPT_MODEL=openai/gpt-3.5-turbo
VSEGPT_MODEL_FORMATTER=qwen/qwen3-next-80b-a3b
```

**Технические детали:**
- AI-подсказки генерируются через API route `/api/games/get-hint`
- Промпт формируется на бэкенде на основе текущего состояния игры
- LLM анализирует доску 4×4 и рекомендует три следующих хода
- Проверка решаемости комбинации выполняется на фронтенде перед запросом к LLM
- Используется недорогая модель для экономии средств

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

## Деплой в Docker

Проект использует Docker для деплоя в продакшене. Это обеспечивает изолированное окружение и простоту развертывания.

### Быстрый старт с Docker Compose:

1. **Подготовка сервера:**
   - Используйте скрипт `server-setup.sh` для автоматической настройки Ubuntu 24 сервера
   - Скрипт установит Docker, Docker Compose и необходимые пакеты

2. **Клонирование и настройка:**
```bash
git clone your-repo-url
cd testnextjs

# Создайте .env файл
cp .env.example .env
# Заполните переменные окружения в .env
```

3. **Запуск приложения:**
```bash
docker compose up -d --build
```

Приложение будет доступно на порту 3000.

### Использование Docker Compose:

```bash
# Запуск
docker compose up -d

# Просмотр логов
docker compose logs -f app

# Остановка
docker compose down

# Пересборка и перезапуск
docker compose up -d --build
```

### Автодеплой через GitHub Actions

Проект настроен для автоматического деплоя при каждом push в ветку `master` или `main`.

**Как это работает:**
1. При пуше в master/main ветку запускается GitHub Actions workflow
2. Выполняются проверки кода (type-check, lint, build)
3. Код автоматически копируется на сервер через SSH
4. На сервере выполняется скрипт `deploy.sh`, который пересобирает и перезапускает контейнер

**Настройка автодеплоя:**
Подробные инструкции по настройке GitHub Actions автодеплоя находятся в файле [`GITHUB_ACTIONS_SETUP.md`](GITHUB_ACTIONS_SETUP.md).

**Основные шаги:**
1. Создайте SSH ключ на сервере
2. Добавьте секреты в GitHub (SSH_PRIVATE_KEY, SERVER_HOST, SERVER_USER, SERVER_PATH и переменные окружения)
3. Сделайте push в master ветку - деплой запустится автоматически

### Настройка Nginx как reverse proxy:

Создайте файл `/etc/nginx/sites-available/nextjs-app`:

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/nextjs-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Настройка HTTPS (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Подробная документация по деплою:

- [`DEPLOY.md`](DEPLOY.md) - полная инструкция по деплою на Ubuntu 24 с Docker
- [`GITHUB_ACTIONS_SETUP.md`](GITHUB_ACTIONS_SETUP.md) - настройка автодеплоя через GitHub Actions

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
- [Docker документация](https://docs.docker.com)
- [GitHub Actions документация](https://docs.github.com/en/actions)

## Лицензия

Учебный проект для изучения Next.js, React и TypeScript.
