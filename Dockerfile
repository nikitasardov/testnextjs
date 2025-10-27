# Dockerfile для Next.js приложения
# Многоэтапная сборка для минимального размера образа

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock ./

# Устанавливаем зависимости (пользуемся кэшем Docker)
# --legacy-peer-deps - для решения проблем с совместимостью
RUN npm ci --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена
# Переменные окружения будут установлены при запуске контейнера
RUN npm run build

# Этап 2: Продакшен (минимальный образ)
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем переменную окружения для продакшена
ENV NODE_ENV=production

# Создаём непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из этапа сборки
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт 3000
EXPOSE 3000

# Переменная для хостинга на нужном порту
ENV PORT=3000

# Команда запуска
CMD ["node", "server.js"]

