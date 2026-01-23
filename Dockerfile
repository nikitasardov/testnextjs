# Dockerfile для Next.js приложения
# Многоэтапная сборка для минимального размера образа

# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Аргументы сборки для переменных окружения Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Устанавливаем переменные окружения для сборки
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock ./

# Устанавливаем зависимости (пользуемся кэшем Docker)
# --frozen-lockfile - используем точные версии из yarn.lock без обновлений
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена
# Переменные окружения будут установлены при запуске контейнера
RUN yarn build

# Этап 2: Продакшен (минимальный образ)
FROM node:22-alpine AS runner

WORKDIR /app

# Устанавливаем переменную окружения для продакшена
ENV NODE_ENV=production

# Создаём непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из этапа сборки
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# В standalone режиме Next.js копирует только необходимые файлы в .next/standalone
# Но некоторые файлы могут отсутствовать, поэтому копируем их дополнительно
# Копируем конфигурационные файлы (они должны существовать в проекте)
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/middleware.ts ./middleware.ts

# Копируем файлы локализации и другие исходные файлы, которые используются в runtime
# В standalone они должны быть в правильной структуре относительно server.js
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт 3000
EXPOSE 3000

# Переменная для хостинга на нужном порту
ENV PORT=3000

# Команда запуска
CMD ["node", "server.js"]

