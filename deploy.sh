#!/bin/bash
# Скрипт для деплоя приложения на сервере
# Используется GitHub Actions для автоматического деплоя

set -e  # Остановка при ошибке
set -x  # Отладочный вывод (показывать все команды)

# Определяем, запущен ли скрипт в CI (GitHub Actions)
# Если TERM не установлен или это CI, не используем цвета
if [ -z "$TERM" ] || [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
    USE_COLORS=false
else
    USE_COLORS=true
fi

# Цвета для вывода (только если не в CI)
if [ "$USE_COLORS" = "true" ]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    GREEN=''
    YELLOW=''
    RED=''
    BLUE=''
    NC=''
fi

echo "=========================================="
echo "НАЧАЛО ДЕПЛОЯ NEXT.JS ПРИЛОЖЕНИЯ"
echo "=========================================="
echo ""

# Показываем информацию о текущем коммите (если есть git)
if command -v git &> /dev/null && [ -d .git ]; then
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'неизвестно')
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo 'неизвестно')
    LAST_COMMIT_MSG=$(git log -1 --format='%h - %s' 2>/dev/null || echo 'неизвестно')
    echo "Текущий коммит: ${CURRENT_COMMIT}"
    echo "Ветка: ${CURRENT_BRANCH}"
    echo "Последний коммит: ${LAST_COMMIT_MSG}"
    echo ""

    # Сохраняем информацию о коммите для проверки после деплоя
    echo "${CURRENT_COMMIT}" > .deploy_commit 2>/dev/null || true
fi

# Показываем время последнего изменения файлов в проекте
echo "Время последнего изменения файлов:"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -5 | xargs ls -lt 2>/dev/null | head -1 || echo "не удалось определить"
echo ""

# Проверка наличия .env файла
echo "[ШАГ 0] Проверка .env файла..."
if [ ! -f .env ]; then
    echo "ОШИБКА: файл .env не найден!"
    exit 1
fi
echo "✓ .env файл найден"

# Проверка обязательных переменных окружения
echo "[ШАГ 0.1] Загрузка переменных окружения..."
set +e  # Временно отключаем set -e для source
source .env
SOURCE_EXIT=$?
set -e  # Включаем обратно
if [ $SOURCE_EXIT -ne 0 ]; then
    echo "ОШИБКА: не удалось загрузить .env файл"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "ОШИБКА: обязательные переменные окружения не установлены!"
    echo "Проверьте наличие NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env"
    exit 1
fi
echo "✓ Переменные окружения загружены"

# Проверка наличия docker-compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Ошибка: Docker не установлен!${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "[ШАГ 1/5] Остановка и удаление текущего контейнера"
echo "=========================================="
# Останавливаем и удаляем контейнеры, сети, но не volumes
docker compose down --remove-orphans || true

# Принудительно удаляем контейнер, если он все еще существует
docker rm -f nextjs-app 2>/dev/null || true

echo ""
echo "=========================================="
echo "[ШАГ 2/5] Удаление старого образа приложения"
echo "=========================================="
# Получаем имя образа из docker-compose
COMPOSE_PROJECT_NAME=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
IMAGE_NAME="${COMPOSE_PROJECT_NAME}-app"

echo "Имя проекта: ${COMPOSE_PROJECT_NAME}"
echo "Ожидаемое имя образа: ${IMAGE_NAME}"

# Удаляем образ по точному имени (если он существует)
if docker images --format "{{.Repository}}" | grep -q "^${IMAGE_NAME}$"; then
    echo "Удаление образа ${IMAGE_NAME}:latest..."
    docker rmi -f ${IMAGE_NAME}:latest 2>/dev/null || true
fi

# Удаляем все образы, которые начинаются с имени проекта
docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${COMPOSE_PROJECT_NAME}" | while read image; do
    echo "Удаление образа: $image"
    docker rmi -f "$image" 2>/dev/null || true
done

# Удаляем образы, используемые docker-compose
docker compose down --rmi local 2>/dev/null || true

# Дополнительная очистка - удаляем все неиспользуемые образы
echo "Очистка неиспользуемых образов..."
docker image prune -f

echo ""
echo "=========================================="
echo "[ШАГ 3/5] Сборка нового образа (без кэша)"
echo "=========================================="
# Показываем текущий ID образа перед пересборкой (если существует)
OLD_IMAGE_ID=""
if docker images --format "{{.ID}}" ${IMAGE_NAME}:latest 2>/dev/null | head -1 > /dev/null 2>&1; then
    OLD_IMAGE_ID=$(docker images --format "{{.ID}}" ${IMAGE_NAME}:latest 2>/dev/null | head -1)
    echo "Старый ID образа: ${OLD_IMAGE_ID}"
    echo "Старое время создания образа:"
    docker inspect ${IMAGE_NAME}:latest --format='{{.Created}}' 2>/dev/null || echo "не удалось получить"
else
    echo "Старый образ не найден (это нормально для первого деплоя)"
fi

echo ""
echo "Начало сборки образа..."
# Собираем образ заново без использования кэша
if ! docker compose build --no-cache --pull; then
    echo "ОШИБКА при сборке образа!"
    exit 1
fi

echo ""
echo "Проверка результата сборки..."
# Проверяем, что образ пересобрался
NEW_IMAGE_ID=$(docker images --format "{{.ID}}" ${IMAGE_NAME}:latest 2>/dev/null | head -1)
if [ -z "$NEW_IMAGE_ID" ]; then
    echo "ОШИБКА: образ не найден после сборки!"
    echo "Доступные образы:"
    docker images | head -10
    exit 1
fi

echo "Новый ID образа: ${NEW_IMAGE_ID}"
echo "Новое время создания образа:"
docker inspect ${IMAGE_NAME}:latest --format='{{.Created}}' 2>/dev/null || echo "не удалось получить"

if [ -n "$OLD_IMAGE_ID" ] && [ "$OLD_IMAGE_ID" = "$NEW_IMAGE_ID" ]; then
        echo "ВНИМАНИЕ: ID образа не изменился! Возможно, код не обновился или используется кэш."
    echo "Проверьте, что файлы были скопированы на сервер перед запуском этого скрипта."
else
        echo "✓ Образ успешно пересобран (ID изменился)"
fi

echo ""
echo "=========================================="
echo "[ШАГ 4/5] Запуск нового контейнера"
echo "=========================================="
# Принудительно пересоздаем контейнер, даже если конфигурация не изменилась
docker compose up -d --force-recreate --remove-orphans --build

echo ""
echo "=========================================="
echo "[ШАГ 5/5] Ожидание запуска приложения"
echo "=========================================="
sleep 5

# Показываем информацию о запущенном контейнере
echo "Информация о контейнере:"
docker compose ps
echo ""
echo "ID образа контейнера:"
docker inspect nextjs-app --format='{{.Image}}' 2>/dev/null || echo "Контейнер еще не запущен"
echo ""
echo "Время создания контейнера:"
docker inspect nextjs-app --format='{{.Created}}' 2>/dev/null || echo "Контейнер еще не запущен"
echo ""
echo "Время создания образа:"
docker inspect ${IMAGE_NAME}:latest --format='{{.Created}}' 2>/dev/null || echo "Образ не найден"
echo ""
echo "Размер образа:"
docker images ${IMAGE_NAME}:latest --format "{{.Size}}" 2>/dev/null || echo "Образ не найден"

# Проверка статуса контейнера
if docker compose ps | grep -q "Up"; then
    echo "✓ Контейнер успешно запущен!"
else
        echo "ОШИБКА: контейнер не запустился"
    echo "Логи контейнера:"
    docker compose logs --tail=50
    exit 1
fi

# Health check
echo -e "${BLUE}Проверка работоспособности приложения...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✓ Приложение отвечает на запросы!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ОШИБКА: Приложение не отвечает после 30 попыток"
        echo "Логи контейнера:"
        docker compose logs --tail=50
        exit 1
    fi
    sleep 2
done

echo ""
echo "=========================================="
echo "ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН!"
echo "=========================================="
echo ""
echo "Статус контейнеров:"
docker compose ps
echo ""
echo "Последние логи:"
docker compose logs --tail=20

