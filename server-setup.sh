#!/bin/bash
# Скрипт для подготовки Ubuntu 24 сервера и запуска Next.js приложения в Docker

set -e  # Остановка при ошибке

echo "=========================================="
echo "Подготовка сервера Ubuntu 24 для Next.js"
echo "=========================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка, что скрипт запущен от root или с sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Пожалуйста, запустите скрипт с sudo${NC}"
    exit 1
fi

echo -e "${GREEN}[1/7] Обновление системы...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}[2/7] Установка необходимых пакетов...${NC}"
apt install -y \
    curl \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    rsync

echo -e "${GREEN}[3/7] Установка Docker...${NC}"
# Удаляем старые версии Docker, если есть
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Добавляем официальный GPG ключ Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo -e "${GREEN}[4/7] Настройка Docker...${NC}"
# Запускаем Docker
systemctl enable docker
systemctl start docker

# Добавляем текущего пользователя в группу docker (если не root)
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo -e "${YELLOW}Пользователь $SUDO_USER добавлен в группу docker${NC}"
    echo -e "${YELLOW}Выйдите и войдите снова, чтобы изменения вступили в силу${NC}"
fi

echo -e "${GREEN}[5/7] Настройка файрвола...${NC}"
# Настройка UFW (Uncomplicated Firewall)
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Next.js (если нужно напрямую)
echo -e "${YELLOW}Файрвол настроен. Порты 22, 80, 443, 3000 открыты${NC}"

echo -e "${GREEN}[6/7] Настройка fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

echo -e "${GREEN}[7/7] Проверка установки...${NC}"
echo "Версия Docker:"
docker --version
echo "Версия Docker Compose:"
docker compose version
echo "Версия rsync:"
rsync --version | head -n 1

echo ""
echo -e "${GREEN}=========================================="
echo "Подготовка сервера завершена!"
echo "==========================================${NC}"
echo ""
echo "Следующие шаги:"
echo "1. Склонируйте репозиторий: git clone <your-repo-url>"
echo "2. Перейдите в директорию проекта: cd testnextjs"
echo "3. Создайте .env файл: cp .env.example .env"
echo "4. Заполните переменные окружения в .env"
echo "5. Запустите приложение: docker compose up -d --build"
echo ""
echo "Для просмотра логов: docker compose logs -f app"
echo "Для остановки: docker compose down"

