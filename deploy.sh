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

echo -e "${GREEN}[1/5] Остановка текущего контейнера...${NC}"
docker compose down || true

echo -e "${GREEN}[2/5] Очистка старых образов...${NC}"
# Очищаем только неиспользуемые образы, не трогая запущенные контейнеры
docker image prune -f

echo -e "${GREEN}[3/5] Сборка нового образа...${NC}"
docker compose build --no-cache

echo -e "${GREEN}[4/5] Запуск контейнера...${NC}"
docker compose up -d

echo -e "${GREEN}[5/5] Ожидание запуска приложения...${NC}"
sleep 5

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

