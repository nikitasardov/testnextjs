import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";

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
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: messages.api.unauthorized });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // Создаем клиент для проверки токена
        const supabaseAuth = createServerSupabaseClient(false);

        // Проверяем токен и получаем пользователя
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: messages.api.invalidToken });
        }

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
                return res.status(500).json({
                    error: error.message,
                });
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
                return res.status(400).json({
                    success: false,
                    error: 'telegram_bot_token must be a string or null',
                });
            }

            if (telegram_chat_id !== undefined && typeof telegram_chat_id !== 'string' && telegram_chat_id !== null) {
                return res.status(400).json({
                    success: false,
                    error: 'telegram_chat_id must be a string or null',
                });
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
                return res.status(500).json({
                    success: false,
                    error: upsertError.message,
                });
            }

            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: messages.api.methodNotAllowed });
        }
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : messages.api.internalError,
        });
    }
}


