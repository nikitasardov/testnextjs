#!/bin/bash
# Скрипт для деплоя приложения на сервере
# Используется GitHub Actions для автоматического деплоя

set -e  # Остановка при ошибке

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Начало деплоя Next.js приложения"
echo "==========================================${NC}"

# Показываем информацию о текущем коммите (если есть git)
if command -v git &> /dev/null && [ -d .git ]; then
    echo "Текущий коммит: $(git rev-parse --short HEAD 2>/dev/null || echo 'неизвестно')"
    echo "Ветка: $(git branch --show-current 2>/dev/null || echo 'неизвестно')"
    echo "Последний коммит: $(git log -1 --format='%h - %s' 2>/dev/null || echo 'неизвестно')"
    echo ""
fi

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}Ошибка: файл .env не найден!${NC}"
    exit 1
fi

# Проверка обязательных переменных окружения
source .env
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Ошибка: обязательные переменные окружения не установлены!${NC}"
    echo "Проверьте наличие NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env"
    exit 1
fi

# Проверка наличия docker-compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Ошибка: Docker не установлен!${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] Остановка и удаление текущего контейнера...${NC}"
# Останавливаем и удаляем контейнеры, сети, но не volumes
docker compose down --remove-orphans || true

# Принудительно удаляем контейнер, если он все еще существует
docker rm -f nextjs-app 2>/dev/null || true

echo -e "${GREEN}[2/5] Удаление старого образа приложения...${NC}"
# Получаем имя образа из docker-compose
COMPOSE_PROJECT_NAME=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
IMAGE_NAME="${COMPOSE_PROJECT_NAME}-app"

# Удаляем все версии образа с таким именем
docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${COMPOSE_PROJECT_NAME}" | xargs -r docker rmi -f 2>/dev/null || true

# Альтернативный способ - удалить образ по тегу из docker-compose
docker compose down --rmi local 2>/dev/null || true

echo -e "${GREEN}[3/5] Сборка нового образа (без кэша)...${NC}"
# Собираем образ заново без использования кэша
docker compose build --no-cache --pull

echo -e "${GREEN}[4/5] Запуск нового контейнера...${NC}"
# Принудительно пересоздаем контейнер, даже если конфигурация не изменилась
docker compose up -d --force-recreate --remove-orphans

echo -e "${GREEN}[5/5] Ожидание запуска приложения...${NC}"
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

# Проверка статуса контейнера
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Контейнер успешно запущен!${NC}"
else
    echo -e "${RED}❌ Ошибка: контейнер не запустился${NC}"
    echo "Логи контейнера:"
    docker compose logs --tail=50
    exit 1
fi

# Health check
echo -e "${BLUE}Проверка работоспособности приложения...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Приложение отвечает на запросы!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Приложение не отвечает после 30 попыток${NC}"
        echo "Логи контейнера:"
        docker compose logs --tail=50
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}=========================================="
echo "Деплой успешно завершен!"
echo "==========================================${NC}"
echo ""
echo "Статус контейнеров:"
docker compose ps
echo ""
echo "Последние логи:"
docker compose logs --tail=20

