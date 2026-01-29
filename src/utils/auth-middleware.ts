import type { NextApiRequest } from 'next';
import { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase';
import { getLocaleFromRequest } from './i18n-api';
import { getAllMessages } from '@/locales/loadMessages';

export type AuthenticatedRequest = NextApiRequest & {
    user: User;
    token: string;
};

export type AuthResult =
    | { success: true; user: User; token: string }
    | { success: false; statusCode: number; error: string };

/**
 * Извлекает токен из заголовка Authorization
 * @param req - Next.js API request
 * @returns токен или null, если токен не найден или имеет неверный формат
 */
function extractToken(req: NextApiRequest): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.replace('Bearer ', '');
}

/**
 * Проверяет токен и возвращает пользователя
 * @param token - токен доступа
 * @returns результат аутентификации
 */
async function verifyToken(token: string): Promise<AuthResult> {
    try {
        const supabaseAuth = createServerSupabaseClient(false);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return {
                success: false,
                statusCode: 401,
                error: 'Invalid token',
            };
        }

        return {
            success: true,
            user,
            token,
        };
    } catch (error) {
        // Логируем ошибку для отладки
        console.error('Token verification error:', error instanceof Error ? error.message : 'Unknown error');
        return {
            success: false,
            statusCode: 401,
            error: 'Authentication failed',
        };
    }
}

/**
 * Middleware для аутентификации API роутов
 * Проверяет токен и добавляет пользователя в request
 * 
 * @param req - Next.js API request
 * @returns результат аутентификации с ошибкой или null, если аутентификация успешна
 */
export async function authenticateRequest(
    req: NextApiRequest
): Promise<{ success: false; statusCode: number; error: string } | null> {
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    // Извлекаем токен
    const token = extractToken(req);

    if (!token) {
        return {
            success: false,
            statusCode: 401,
            error: messages.api.unauthorized,
        };
    }

    // Проверяем токен
    const authResult = await verifyToken(token);

    if (!authResult.success) {
        return {
            success: false,
            statusCode: authResult.statusCode,
            error: authResult.error === 'Invalid token'
                ? messages.api.invalidToken
                : messages.api.unauthorized,
        };
    }

    // Добавляем пользователя и токен в request
    (req as AuthenticatedRequest).user = authResult.user;
    (req as AuthenticatedRequest).token = authResult.token;

    return null; // null означает успешную аутентификацию
}

/**
 * Проверки, что request аутентифицирован
 */
export function isAuthenticatedRequest(req: NextApiRequest): req is AuthenticatedRequest {
    return 'user' in req && 'token' in req;
}

