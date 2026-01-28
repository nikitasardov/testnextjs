import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";
import type { ApiResponse } from "@/types/api-response";

type User = {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
};

/**
 * Маскирует email адрес для безопасности
 * Правила:
 * - Если часть до @ имеет 1 символ - показываем его + 4 звездочки
 * - Если часть до @ имеет 2+ символа - показываем первые 2 + 4 звездочки
 * - Всегда 4 звездочки независимо от реальной длины
 * 
 * Примеры:
 * - "a@gmail.com" → "a****@gmail.com"
 * - "ab@gmail.com" → "ab****@gmail.com"
 * - "pivanov@gmail.com" → "pi****@gmail.com"
 */
function maskEmail(email: string | undefined | null): string | undefined {
    if (!email) {
        return undefined;
    }

    const [localPart, domain] = email.split("@");

    if (!domain) {
        // Если нет @, возвращаем как есть (некорректный email)
        return email;
    }

    if (localPart.length === 0) {
        return `****@${domain}`;
    }

    if (localPart.length === 1) {
        return `${localPart}****@${domain}`;
    }

    // Если 2+ символа, показываем первые 2
    return `${localPart.substring(0, 2)}****@${domain}`;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<User[]>>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== "GET") {
            throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
        }

        // Используем Admin API с service_role ключом
        // ВАЖНО: Этот ключ должен быть только на сервере, никогда не используйте его на клиенте!
        // Используем единообразный способ создания клиента через createServerSupabaseClient
        const supabaseAdmin = createServerSupabaseClient(true);

        // Получаем список всех пользователей
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            // Передаем оригинальную ошибку для логирования на сервере, но клиенту отправляем безопасное сообщение
            throw new ApiError(
                ApiErrorCode.INTERNAL_ERROR,
                messages.api.internalError,
                500,
                error instanceof Error ? error : new Error(String(error))
            );
        }

        // Форматируем данные пользователей с маскировкой email
        const formattedUsers: User[] = users.map((user) => ({
            id: user.id,
            email: maskEmail(user.email), // Маскируем email на сервере
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || undefined,
        }));

        return res.status(200).json({
            success: true,
            data: formattedUsers,
        });
    } catch (error) {
        handleApiError(error, req, res);
    }
}

