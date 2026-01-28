import { ApiErrorCode } from '@/utils/api-error';

/**
 * Стандартный формат ответа API
 * Используется для единообразия всех ответов сервера
 * 
 * @template T - тип данных в случае успешного ответа
 */
export type ApiResponse<T = unknown> =
    | {
        success: true;
        data: T;
        error?: never;
    }
    | {
        success: false;
        data?: never;
        error: {
            code: ApiErrorCode;
            message: string;
        };
    };

/**
 * Тип для успешного ответа API
 */
export type ApiSuccessResponse<T> = {
    success: true;
    data: T;
};

/**
 * Тип для ответа с ошибкой API
 */
export type ApiErrorResponse = {
    success: false;
    error: {
        code: ApiErrorCode;
        message: string;
    };
};

