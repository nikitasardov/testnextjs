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

### 3. Деплой на свой сервер

#### Установка:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
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

### 4. Docker деплой
```bash
docker build -t nextjs-app .
docker run -d -p 3000:3000 --env-file .env nextjs-app
```

Или через docker-compose:
```bash
docker-compose up -d
```
