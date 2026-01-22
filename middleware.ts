import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './src/locales/config';

export default createMiddleware({
    locales,
    defaultLocale,
    localeDetection: true, // Включаем определение локали из cookie и заголовков
    localePrefix: 'never', // Не добавляем префиксы локали в URL
    localeCookie: {
        name: 'locale', // Имя cookie для хранения локали
    },
});

export const config = {
    matcher: [String.raw`/((?!_next|.*\..*).*)`],
};

