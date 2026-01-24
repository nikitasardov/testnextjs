import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { defaultLocale, locales } from './src/locales/config';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localeDetection: true, // Включаем определение локали из cookie и заголовков
    localePrefix: 'never', // Не добавляем префиксы локали в URL
    localeCookie: {
        name: 'locale', // Имя cookie для хранения локали
    },
});

// Обертка для логирования и диагностики
export default function middleware(request: NextRequest) {
    const response = intlMiddleware(request);

    // ПРОБЛЕМА: next-intl делает rewrite на /ru даже при localePrefix: 'never'
    // Временное решение: убираем rewrite заголовок, чтобы Next.js обрабатывал оригинальный путь
    // Проверяем, что rewrite ведет на путь с локалью (которого нет в pages-manifest.json)
    const rewritePath = response.headers.get('x-middleware-rewrite');
    if (rewritePath && (rewritePath.includes('/ru') || rewritePath.includes('/en') || rewritePath.includes('/es') || rewritePath.includes('/kk') || rewritePath.includes('/zh') || rewritePath.includes('/ko') || rewritePath.includes('/ja'))) {
        // Создаем новый NextResponse без rewrite заголовка, но сохраняем все остальные заголовки
        const nextResponse = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
        // Копируем все заголовки кроме rewrite
        response.headers.forEach((value, key) => {
            if (key !== 'x-middleware-rewrite') {
                nextResponse.headers.set(key, value);
            }
        });
        return nextResponse;
    }

    return response;
}

export const config = {
    matcher: [String.raw`/((?!_next|.*\..*).*)`],
};

