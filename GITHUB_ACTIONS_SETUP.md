# Быстрая настройка GitHub Actions автодеплоя

## Шаг 1: Создание SSH ключа на сервере

```bash
ssh user@your-server

# Создайте SSH ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Добавьте публичный ключ в authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Установите права
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy

# Выведите приватный ключ (скопируйте весь вывод)
cat ~/.ssh/github_actions_deploy
```

## Шаг 2: Настройка GitHub Secrets

Перейдите в GitHub репозиторий: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Добавьте следующие секреты:

| Name                            | Value                         | Описание                           |
| ------------------------------- | ----------------------------- | ---------------------------------- |
| `SSH_PRIVATE_KEY`               | Весь приватный ключ из шага 1 | SSH ключ для подключения к серверу |
| `SERVER_HOST`                   | IP или домен сервера          | Например: `123.45.67.89`           |
| `SERVER_USER`                   | Имя пользователя              | Например: `root` или `ubuntu`      |
| `SERVER_PATH`                   | Путь к проекту                | Например: `/var/www/testnextjs`    |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL Supabase проекта          | Из настроек Supabase               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon ключ                     | Из настроек Supabase               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role ключ             | Из настроек Supabase (опционально) |

## Шаг 3: Проверка файлов

Убедитесь, что в репозитории есть:
- `.github/workflows/deploy.yml` ✅
- `deploy.sh` ✅
- `Dockerfile` ✅
- `docker-compose.yml` ✅

## Шаг 4: Первый деплой

```bash
git add .
git commit -m "Setup GitHub Actions autodeploy"
git push origin master
```

Перейдите в **Actions** вкладку и следите за прогрессом деплоя.

## Проверка работы

После успешного деплоя:

```bash
# На сервере
docker compose ps
docker compose logs -f app

# Проверка доступности
curl http://your-server-ip:3000
```

## Устранение проблем

### Exit code 12 (rsync ошибка)

**Причины:**
- **rsync не установлен на сервере**
- Директория на сервере не существует
- Нет прав на запись в директорию
- Неправильный путь в `SERVER_PATH`

**Решение:**

**1. Проверьте наличие rsync:**
```bash
# На сервере проверьте
which rsync
rsync --version
```

**2. Если rsync не установлен, установите его:**
```bash
# На сервере
sudo apt update
sudo apt install -y rsync

# Или используйте скрипт подготовки сервера (server-setup.sh), 
# который автоматически установит rsync
```

**3. Проверьте и создайте директорию:**
```bash
# На сервере проверьте и создайте директорию
ssh user@your-server
sudo mkdir -p /var/www/testnextjs
sudo chown -R $USER:$USER /var/www/testnextjs
```

### Exit code 1 (ошибка выполнения скрипта)

**Причины:**
- Файл `deploy.sh` не найден или не исполняемый
- Ошибка в скрипте деплоя
- Проблемы с Docker

**Решение:**
```bash
# На сервере проверьте
cd /var/www/testnextjs
ls -la deploy.sh
chmod +x deploy.sh

# Проверьте Docker
docker --version
docker compose version
```

### Ошибка SSH подключения

**Причины:**
- Неправильный `SERVER_HOST` или `SERVER_USER`
- SSH ключ скопирован не полностью
- Публичный ключ не добавлен в `authorized_keys`

**Решение:**
```bash
# На сервере проверьте
cat ~/.ssh/authorized_keys | grep github-actions

# Если ключа нет, добавьте его
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Ошибка при деплое

**Диагностика:**
1. Откройте логи в GitHub Actions (Actions → выберите workflow → Deploy to Server)
2. Проверьте каждый шаг на наличие ошибок
3. На сервере проверьте логи:
```bash
ssh user@your-server
cd /var/www/testnextjs
docker compose logs -f app
```

**Частые проблемы:**
- **rsync не установлен** (проверьте: `which rsync` или `rsync --version`)
- Переменные окружения не установлены в GitHub Secrets
- Docker не запущен на сервере
- Порты заняты другими процессами

**Быстрая проверка на сервере:**
```bash
# Проверьте наличие rsync
which rsync || echo "rsync не установлен! Установите: sudo apt install -y rsync"

# Проверьте Docker
docker --version
docker compose version

# Проверьте переменные окружения
cat .env
```

### Health check failed

**Причины:**
- Приложение не запустилось
- Порт 3000 закрыт файрволом
- Приложение запускается дольше ожидаемого

**Решение:**
```bash
# Проверьте статус контейнера
docker compose ps

# Проверьте логи
docker compose logs --tail=100 app

# Проверьте файрвол
sudo ufw status
sudo ufw allow 3000/tcp

# Увеличьте время ожидания в workflow (если нужно)
```

### Проблемы с переменными окружения

**Проверка:**
```bash
# На сервере проверьте .env файл
cat .env

# Убедитесь, что все переменные установлены
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY (опционально)
```

## Ручной запуск деплоя

1. GitHub → Actions → Deploy to Production
2. Нажмите "Run workflow"
3. Выберите ветку и запустите




