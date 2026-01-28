import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { authenticateRequest, type AuthenticatedRequest } from "@/utils/auth-middleware";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";

type Data = {
    success: boolean;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== "POST") {
            throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
        }

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
        const { gameType, droppables } = req.body;

        if (!gameType || !droppables) {
            throw new ApiError(
                ApiErrorCode.MISSING_PARAMETER,
                messages.api.gameTypeAndDroppablesRequired
            );
        }

        if (gameType !== 'example' && gameType !== '15-puzzle') {
            throw new ApiError(ApiErrorCode.INVALID_PARAMETER, messages.api.invalidGameType);
        }

        // Создаем клиент с токеном пользователя для работы с RLS
        const supabase = createServerSupabaseClient(false, token);

        // Сохраняем или обновляем конфигурацию игры
        // Убеждаемся, что user_id соответствует текущему пользователю
        const { error: upsertError } = await supabase
            .from('game_configs')
            .upsert({
                user_id: user.id,
                game_type: gameType,
                droppables: droppables,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,game_type'
            });

        if (upsertError) {
            // Передаем оригинальную ошибку для логирования на сервере, но клиенту отправляем безопасное сообщение
            throw new ApiError(
                ApiErrorCode.INTERNAL_ERROR,
                messages.api.internalError,
                500,
                upsertError instanceof Error ? upsertError : new Error(String(upsertError))
            );
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        handleApiError(error, req, res, { success: false });
    }
}

