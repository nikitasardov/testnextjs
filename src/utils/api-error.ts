/**
 * Коды ошибок API
 */
export enum ApiErrorCode {
    // Аутентификация и авторизация
    UNAUTHORIZED = 'UNAUTHORIZED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

    // Валидация входных данных
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    MISSING_PARAMETER = 'MISSING_PARAMETER',
    INVALID_PARAMETER = 'INVALID_PARAMETER',

    // Бизнес-логика
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    FORBIDDEN = 'FORBIDDEN',

    // Внешние сервисы
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    VSEGPT_API_ERROR = 'VSEGPT_API_ERROR',
    VSEGPT_API_KEY_NOT_CONFIGURED = 'VSEGPT_API_KEY_NOT_CONFIGURED',
    VSEGPT_INVALID_RESPONSE = 'VSEGPT_INVALID_RESPONSE',

    // Системные ошибки
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Класс для обработки ошибок API
 * Обеспечивает единый формат ошибок и их локализацию
 */
export class ApiError extends Error {
    public readonly code: ApiErrorCode;
    public readonly statusCode: number;
    public readonly originalError?: Error;

    constructor(
        code: ApiErrorCode,
        message?: string,
        statusCode?: number,
        originalError?: Error
    ) {
        super(message || code);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode || ApiError.getDefaultStatusCode(code);
        this.originalError = originalError;

        // Сохраняем стек трейс оригинальной ошибки, если она есть
        if (originalError?.stack) {
            this.stack = originalError.stack;
        }
    }

    /**
     * Возвращает HTTP статус код по умолчанию для кода ошибки
     */
    private static getDefaultStatusCode(code: ApiErrorCode): number {
        const statusMap: Record<ApiErrorCode, number> = {
            [ApiErrorCode.UNAUTHORIZED]: 401,
            [ApiErrorCode.INVALID_TOKEN]: 401,
            [ApiErrorCode.AUTHENTICATION_FAILED]: 401,
            [ApiErrorCode.VALIDATION_ERROR]: 400,
            [ApiErrorCode.MISSING_PARAMETER]: 400,
            [ApiErrorCode.INVALID_PARAMETER]: 400,
            [ApiErrorCode.NOT_FOUND]: 404,
            [ApiErrorCode.CONFLICT]: 409,
            [ApiErrorCode.FORBIDDEN]: 403,
            [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
            [ApiErrorCode.VSEGPT_API_ERROR]: 502,
            [ApiErrorCode.VSEGPT_API_KEY_NOT_CONFIGURED]: 500,
            [ApiErrorCode.VSEGPT_INVALID_RESPONSE]: 502,
            [ApiErrorCode.INTERNAL_ERROR]: 500,
            [ApiErrorCode.METHOD_NOT_ALLOWED]: 405,
            [ApiErrorCode.UNKNOWN_ERROR]: 500,
        };

        return statusMap[code] || 500;
    }

    /**
     * Создает ApiError из обычной ошибки
     */
    static fromError(error: Error, code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR): ApiError {
        return new ApiError(code, error.message, undefined, error);
    }
}

