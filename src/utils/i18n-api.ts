import type { NextApiRequest } from 'next';
import { defaultLocale, locales } from '@/locales/config';
import { getAllMessages } from '@/locales/loadMessages';

/**
 * Определяет локаль из запроса (cookie -> Accept-Language -> default)
 */
export function getLocaleFromRequest(req: NextApiRequest): string {
    // Проверяем cookie
    const cookieLocale = req.cookies.locale;
    if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
        return cookieLocale;
    }

    // Проверяем Accept-Language заголовок
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
        const preferred = acceptLanguage.split(',').map((part) => part.trim().split(';')[0]);
        const match = preferred.find((lang) => locales.includes(lang as (typeof locales)[number]));
        if (match) return match;
    }

    return defaultLocale;
}

/**
 * Получает локализованные сообщения для API
 */
export function getApiMessages(locale: string) {
    const messages = getAllMessages(locale);
    return messages.api;
}

/**
 * Хелпер для получения локализованного сообщения об ошибке
 */
export function getLocalizedError(req: NextApiRequest, key: keyof typeof import('@/locales/ru').default.api): string {
    const locale = getLocaleFromRequest(req);
    const messages = getApiMessages(locale);
    return messages[key];
}

