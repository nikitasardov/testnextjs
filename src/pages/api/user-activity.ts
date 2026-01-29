import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, isAuthenticatedRequest } from "@/utils/auth-middleware";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";
import type { ApiResponse } from "@/types/api-response";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<null>>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== "POST") {
            throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
        }

        // Проверяем аутентификацию
        const authError = await authenticateRequest(req);
        if (authError) {
            return res.status(authError.statusCode).json({
                success: false,
                error: {
                    code: ApiErrorCode.UNAUTHORIZED,
                    message: authError.error,
                },
            });
        }

        if (!isAuthenticatedRequest(req)) {
            throw new ApiError(ApiErrorCode.UNAUTHORIZED, messages.api.unauthorized);
        }

        const { user } = req;

        // Используем Admin API для обновления user_metadata
        const supabaseAdmin = createServerSupabaseClient(true);

        // Обновляем user_metadata с временем последней активности
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    last_activity_at: new Date().toISOString(),
                },
            }
        );

        if (updateError) {
            throw new ApiError(
                ApiErrorCode.INTERNAL_ERROR,
                messages.api.internalError,
                500,
                updateError instanceof Error ? updateError : new Error(String(updateError))
            );
        }

        return res.status(200).json({
            success: true,
            data: null,
        });
    } catch (error) {
        handleApiError(error, req, res);
    }
}

