# Инструкции по деплою

## Быстрый старт

### 1. Проверка перед деплоем
```bash
yarn type-check  # Проверка TypeScript
yarn lint        # Проверка линтера
yarn build       # Сборка
yarn start       # Тест сборки
```

### 2. Деплой на Vercel (рекомендуется)
- Зайдите на vercel.com
- Подключите GitHub репозиторий
- Добавьте переменные окружения
- Нажмите Deploy

### 3. Деплой на Ubuntu 24 сервер с Docker (рекомендуется для продакшена)

#### Шаг 1: Подготовка сервера

Подключитесь к серверу по SSH и выполните:

```bash
# Скачайте скрипт подготовки сервера
wget https://raw.githubusercontent.com/your-repo/testnextjs/main/server-setup.sh
# Или скопируйте файл server-setup.sh на сервер

# Сделайте скрипт исполняемым
chmod +x server-setup.sh

# Запустите скрипт (требуются права root)
sudo ./server-setup.sh
```

Скрипт автоматически:
- Обновит систему
- Установит необходимые пакеты (curl, git, rsync и др.)
- Установит Docker и Docker Compose
- Настроит файрвол (откроет порты 22, 80, 443, 3000)
- Настроит fail2ban для защиты от брутфорса

**Важно:** Скрипт устанавливает `rsync`, который необходим для GitHub Actions автодеплоя.

**Важно:** После выполнения скрипта выйдите и войдите снова, чтобы изменения в группе docker вступили в силу.

#### Шаг 2: Клонирование и настройка проекта

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd testnextjs

# Создайте файл .env с переменными окружения
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EOF

# Отредактируйте .env файл с реальными значениями
nano .env
```

#### Шаг 3: Запуск приложения

```bash
# Соберите и запустите контейнер
docker compose up -d --build

# Проверьте статус
docker compose ps

# Просмотрите логи
docker compose logs -f app
```

Приложение будет доступно по адресу `http://your-server-ip:3000`

#### Шаг 4: Настройка Nginx (опционально, для домена)

Если у вас есть домен, настройте Nginx как reverse proxy:

```bash
# Установите Nginx
sudo apt install -y nginx

# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/nextjs-app
```

Добавьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

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
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx
```

#### Шаг 5: Настройка SSL с Let's Encrypt (опционально)

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d ваш-домен.com

# Автоматическое обновление настроено автоматически
```

#### Полезные команды Docker

```bash
# Остановить приложение
docker compose down

# Перезапустить приложение
docker compose restart

# Пересобрать и перезапустить
docker compose up -d --build

# Просмотр логов
docker compose logs -f app

# Просмотр использования ресурсов
docker stats

# Очистка неиспользуемых образов
docker system prune -a
```

### 4. Автодеплой с GitHub Actions (рекомендуется)

Настройка автоматического деплоя при каждом мерже в ветку `master` или `main`.

#### Шаг 1: Подготовка SSH ключа на сервере

Подключитесь к серверу и выполните:

```bash
# Создайте SSH ключ для деплоя (если еще нет)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Скопируйте публичный ключ в authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy

# Выведите приватный ключ (понадобится для GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

**Важно:** Скопируйте весь вывод приватного ключа (включая `-----BEGIN OPENSSH PRIVATE KEY-----` и `-----END OPENSSH PRIVATE KEY-----`)

#### Шаг 2: Настройка GitHub Secrets

1. Перейдите в ваш GitHub репозиторий
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret** и добавьте следующие секреты:

**SSH_PRIVATE_KEY**
- Name: `SSH_PRIVATE_KEY`
- Value: Весь приватный SSH ключ (который вы скопировали на шаге 1)

**SERVER_HOST**
- Name: `SERVER_HOST`
- Value: IP адрес или домен вашего сервера (например: `123.45.67.89` или `example.com`)

**SERVER_USER**
- Name: `SERVER_USER`
- Value: Имя пользователя для SSH подключения (обычно `root` или ваш пользователь)

**SERVER_PATH**
- Name: `SERVER_PATH`
- Value: Полный путь к директории проекта на сервере (например: `/var/www/testnextjs`)

**NEXT_PUBLIC_SUPABASE_URL**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: URL вашего Supabase проекта

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Anon ключ из Supabase

**SUPABASE_SERVICE_ROLE_KEY**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Service role ключ из Supabase (опционально, но рекомендуется)

**VSEGPT_API_KEY**
- Name: `VSEGPT_API_KEY`
- Value: API ключ для VseGPT (для работы подсказок в игре 15-puzzle)

**VSEGPT_MODEL**
- Name: `VSEGPT_MODEL`
- Value: Модель LLM для использования (опционально, по умолчанию: `openai/gpt-3.5-turbo-1106`)

#### Шаг 3: Проверка workflow файла

Убедитесь, что файл `.github/workflows/deploy.yml` существует в репозитории. Он уже должен быть создан и содержать конфигурацию для автодеплоя.

#### Шаг 4: Первый деплой

1. Сделайте коммит и пуш в ветку `master` или `main`:
```bash
git add .
git commit -m "Setup GitHub Actions autodeploy"
git push origin master
```

2. Перейдите в **Actions** вкладку вашего GitHub репозитория
3. Вы увидите запущенный workflow "Deploy to Production"
4. Нажмите на него, чтобы увидеть прогресс

#### Шаг 5: Проверка деплоя

После успешного выполнения workflow:

1. Проверьте статус контейнера на сервере:
```bash
ssh user@your-server
cd /var/www/testnextjs
docker compose ps
docker compose logs -f app
```

2. Проверьте доступность приложения:
```bash
curl http://your-server-ip:3000
```

#### Как это работает

1. **При пуше в master/main:**
   - GitHub Actions запускает workflow
   - Выполняются проверки: type-check, lint, build
   - Если проверки прошли, начинается деплой

2. **Процесс деплоя:**
   - Код копируется на сервер через SSH
   - На сервере выполняется скрипт `deploy.sh`
   - Скрипт останавливает старый контейнер, собирает новый и запускает его
   - Выполняется health check

3. **Безопасность:**
   - Все чувствительные данные хранятся в GitHub Secrets
   - SSH ключ используется только для деплоя
   - Проверки кода выполняются перед деплоем

#### Ручной запуск деплоя

Вы можете запустить деплой вручную:

1. Перейдите в **Actions** → **Deploy to Production**
2. Нажмите **Run workflow**
3. Выберите ветку и нажмите **Run workflow**

#### Мониторинг и отладка

**Просмотр логов на сервере:**
```bash
# Логи приложения
docker compose logs -f app

# Логи последнего деплоя
tail -f /var/log/deploy.log  # если настроено логирование
```

**Проверка статуса workflow:**
- GitHub Actions показывает детальные логи каждого шага
- При ошибке вы увидите точное место проблемы

**Откат к предыдущей версии:**
```bash
# На сервере
cd /var/www/testnextjs
git log --oneline  # посмотреть историю коммитов
git checkout <commit-hash>  # откатиться к нужному коммиту
./deploy.sh  # перезапустить
```

#### Дополнительные настройки

**Изменение ветки для автодеплоя:**

Отредактируйте `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches:
      - production  # измените на нужную ветку
```

**Добавление уведомлений:**

Можно добавить уведомления в Slack, Discord или email при успешном/неуспешном деплое. Пример для Slack:

```yaml
- name: Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment ${{ job.status }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 5. Деплой на свой сервер (без Docker)

#### Установка:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2 yarn
```

#### Настройка:
```bash
git clone your-repo
cd your-repo
yarn install
cp .env.example .env  # Заполните значения
yarn build
```

#### Запуск:
```bash
pm2 start yarn --name "nextjs-app" -- start
pm2 save
pm2 startup
```

#### Nginx конфигурация:
/etc/nginx/sites-available/nextjs-app
```nginx
server {
    listen 80;
    server_name ваш-домен.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
