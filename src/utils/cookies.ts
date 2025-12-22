/**
 * Утилиты для работы с cookies
 */

/**
 * Устанавливает cookie
 * @param name - имя cookie
 * @param value - значение cookie
 * @param days - количество дней до истечения (по умолчанию 365)
 */
export function setCookie(name: string, value: string, days = 365): void {
    if (globalThis.document === undefined) {
        return;
    }

    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toUTCString()}`;
    }
    globalThis.document.cookie = `${name}=${value || ''}${expires}; path=/`;
}

/**
 * Получает значение cookie по имени (клиентская версия)
 * @param name - имя cookie
 * @returns значение cookie или null, если не найдено
 */
export function getCookie(name: string): string | null {
    if (globalThis.document === undefined) {
        return null;
    }

    const nameEQ = `${name}=`;
    const cookies = globalThis.document.cookie.split(';');

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith(nameEQ)) {
            return trimmedCookie.substring(nameEQ.length);
        }
    }

    return null;
}

/**
 * Получает значение cookie по имени из строки заголовков (серверная версия)
 * @param cookieHeader - строка заголовка Cookie из запроса
 * @param name - имя cookie
 * @returns значение cookie или null, если не найдено
 */
export function getCookieFromHeader(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader) {
        return null;
    }

    const nameEQ = `${name}=`;
    const cookies = cookieHeader.split(';');

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith(nameEQ)) {
            return trimmedCookie.substring(nameEQ.length);
        }
    }

    return null;
}

