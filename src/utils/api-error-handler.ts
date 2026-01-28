import type { NextApiResponse, NextApiRequest } from 'next';
import { ApiError, ApiErrorCode } from './api-error';
import { getLocaleFromRequest } from './i18n-api';
import { getAllMessages } from '@/locales/loadMessages';
import type { ApiErrorResponse } from '@/types/api-response';

/**
 * Обрабатывает ошибку и возвращает локализованное сообщение
 * @param error - ошибка (ApiError или обычная Error)
 * @param req - Next.js request для получения локали
 * @returns объект с кодом ошибки и локализованным сообщением
 */
function getLocalizedError(error: Error, req: NextApiRequest): { code: ApiErrorCode; message: string; statusCode: number } {
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    if (error instanceof ApiError) {
        // Если это ApiError, используем его код и статус
        // Если сообщение было передано явно при создании ApiError (например, messages.products.notFound(id)),
        // используем его. Иначе пытаемся найти локализованное сообщение по коду.
        let message: string;
        if (error.message && error.message !== error.code) {
            // Сообщение было передано явно, используем его
            message = error.message;
        } else {
            // Сообщение не было передано, ищем в маппинге
            message = getLocalizedMessage(error.code, messages);
        }
        return {
            code: error.code,
            message,
            statusCode: error.statusCode,
        };
    }

    // Для обычных ошибок используем общий код
    return {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: messages.api.unknownError,
        statusCode: 500,
    };
}

/**
 * Получает локализованное сообщение для кода ошибки
 */
function getLocalizedMessage(code: ApiErrorCode, messages: ReturnType<typeof getAllMessages>): string {
    const messageMap: Partial<Record<ApiErrorCode, string>> = {
        [ApiErrorCode.UNAUTHORIZED]: messages.api.unauthorized,
        [ApiErrorCode.INVALID_TOKEN]: messages.api.invalidToken,
        [ApiErrorCode.AUTHENTICATION_FAILED]: messages.api.authenticationFailed,
        [ApiErrorCode.METHOD_NOT_ALLOWED]: messages.api.methodNotAllowed,
        [ApiErrorCode.VSEGPT_API_ERROR]: messages.api.vsegptApiError,
        [ApiErrorCode.VSEGPT_API_KEY_NOT_CONFIGURED]: messages.api.vsegptApiKeyNotConfigured,
        [ApiErrorCode.VSEGPT_INVALID_RESPONSE]: messages.api.invalidResponseFormat,
        [ApiErrorCode.INTERNAL_ERROR]: messages.api.internalError,
        [ApiErrorCode.UNKNOWN_ERROR]: messages.api.unknownError,
    };

    return messageMap[code] || messages.api.unknownError;
}

/**
 * Создает стандартный ответ с ошибкой в формате ApiErrorResponse
 * @param error - ошибка
 * @param req - Next.js request
 * @returns стандартный ответ с ошибкой и HTTP статус код
 */
function createStandardErrorResponse(
    error: Error,
    req: NextApiRequest
): { response: ApiErrorResponse; statusCode: number } {
    const { code, message, statusCode } = getLocalizedError(error, req);

    // Логируем ошибку для отладки (только на сервере)
    // В dev режиме логируем полную информацию, включая originalError если есть
    if (process.env.NODE_ENV === 'production') {
        // В продакшене логируем только код ошибки, без деталей
        console.error(`[ApiError] ${code}: ${statusCode}`);
    } else {
        // В dev режиме логируем подробную информацию
        const logData: unknown[] = [`[ApiError] ${code}: ${message}`];
        if (error instanceof ApiError && error.originalError) {
            // Если есть оригинальная ошибка (например, от Supabase), логируем её для отладки
            logData.push('\nOriginal error:', error.originalError);
        } else {
            logData.push(error);
        }
        console.error(...logData);
    }

    return {
        response: {
            success: false,
            error: {
                code,
                message,
            },
        },
        statusCode,
    };
}

/**
 * Обрабатывает ошибку и отправляет стандартный ответ клиенту
 * 
 * @param error - ошибка для обработки
 * @param req - Next.js request
 * @param res - Next.js response
 */
export function handleApiError(
    error: unknown,
    req: NextApiRequest,
    res: NextApiResponse
): void {
    let apiError: ApiError;
    if (error instanceof ApiError) {
        apiError = error;
    } else if (error instanceof Error) {
        apiError = ApiError.fromError(error);
    } else {
        apiError = new ApiError(ApiErrorCode.UNKNOWN_ERROR, 'Unknown error occurred');
    }

    const { response, statusCode } = createStandardErrorResponse(apiError, req);
    res.status(statusCode).json(response);
}
