import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { authenticateRequest, type AuthenticatedRequest } from "@/utils/auth-middleware";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";

type GameConfig = {
    droppables: { [key: string]: { name: string, items: string[] } };
};

type Data = {
    config: GameConfig | null;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== "GET") {
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
        const { gameType } = req.query;

        if (!gameType || typeof gameType !== 'string') {
            throw new ApiError(ApiErrorCode.MISSING_PARAMETER, messages.api.gameTypeRequired);
        }

        if (gameType !== 'example' && gameType !== '15-puzzle') {
            throw new ApiError(ApiErrorCode.INVALID_PARAMETER, messages.api.invalidGameType);
        }

        // Создаем клиент с токеном пользователя для работы с RLS
        const supabase = createServerSupabaseClient(false, token);

        // Загружаем конфигурацию игры
        const { data, error } = await supabase
            .from('game_configs')
            .select('droppables')
            .eq('user_id', user.id)
            .eq('game_type', gameType)
            .maybeSingle();

        if (error) {
            // Передаем оригинальную ошибку для логирования на сервере, но клиенту отправляем безопасное сообщение
            throw new ApiError(
                ApiErrorCode.INTERNAL_ERROR,
                messages.api.internalError,
                500,
                error instanceof Error ? error : new Error(String(error))
            );
        }

        if (!data) {
            return res.status(200).json({ config: null });
        }

        return res.status(200).json({ config: { droppables: data.droppables } });
    } catch (error) {
        handleApiError(error, req, res, { config: null });
    }
}

