export const locales = ['ru', 'en', 'es'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'ru';

// Приоритет источников языка: профиль → cookie → Accept-Language → ru
export const localeSourceOrder = ['profile', 'cookie', 'accept-language', 'default'] as const;

