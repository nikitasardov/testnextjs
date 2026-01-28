import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { authenticateRequest, type AuthenticatedRequest } from "@/utils/auth-middleware";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";

type UserSettings = {
    telegram_bot_token: string | null;
    telegram_chat_id: string | null;
};

type Data = {
    settings?: UserSettings;
    success?: boolean;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        // Проверка авторизации через middleware
        const authError = await authenticateRequest(req);
        if (authError) {
            throw new ApiError(
                authError.error === messages.api.invalidToken
                    ? ApiErrorCode.INVALID_TOKEN
                    : ApiErrorCode.UNAUTHORIZED,
                authError.error,
                authError.statusCode
            );
        }

        const { user, token } = req as AuthenticatedRequest;

        // Создаем клиент с токеном пользователя для работы с RLS
        const supabase = createServerSupabaseClient(false, token);

        if (req.method === "GET") {
            // Получаем настройки пользователя
            const { data, error } = await supabase
                .from('user_settings')
                .select('telegram_bot_token, telegram_chat_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                throw new ApiError(
                    ApiErrorCode.INTERNAL_ERROR,
                    error.message,
                    500
                );
            }

            // Если настройки не найдены, возвращаем пустые значения
            if (!data) {
                return res.status(200).json({
                    settings: {
                        telegram_bot_token: null,
                        telegram_chat_id: null,
                    },
                });
            }

            return res.status(200).json({
                settings: {
                    telegram_bot_token: data.telegram_bot_token,
                    telegram_chat_id: data.telegram_chat_id,
                },
            });
        } else if (req.method === "POST" || req.method === "PUT") {
            // Сохраняем настройки пользователя
            const { telegram_bot_token, telegram_chat_id } = req.body;

            // Валидация: оба поля опциональны, но если переданы, должны быть строками
            if (telegram_bot_token !== undefined && typeof telegram_bot_token !== 'string' && telegram_bot_token !== null) {
                throw new ApiError(
                    ApiErrorCode.VALIDATION_ERROR,
                    'telegram_bot_token must be a string or null'
                );
            }

            if (telegram_chat_id !== undefined && typeof telegram_chat_id !== 'string' && telegram_chat_id !== null) {
                throw new ApiError(
                    ApiErrorCode.VALIDATION_ERROR,
                    'telegram_chat_id must be a string or null'
                );
            }

            // Сохраняем или обновляем настройки
            const { error: upsertError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    telegram_bot_token: telegram_bot_token ?? null,
                    telegram_chat_id: telegram_chat_id ?? null,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id'
                });

            if (upsertError) {
                throw new ApiError(
                    ApiErrorCode.INTERNAL_ERROR,
                    upsertError.message,
                    500
                );
            }

            return res.status(200).json({ success: true });
        } else {
            throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
}


