import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";

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
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    if (req.method !== "GET") {
        return res.status(405).json({ config: null, error: messages.api.methodNotAllowed });
    }

    const { gameType } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ config: null, error: messages.api.unauthorized });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!gameType || typeof gameType !== 'string') {
        return res.status(400).json({ config: null, error: messages.api.gameTypeRequired });
    }

    if (gameType !== 'example' && gameType !== '15-puzzle') {
        return res.status(400).json({ config: null, error: messages.api.invalidGameType });
    }

    try {
        // Создаем клиент с токеном пользователя для работы с RLS
        const supabase = createServerSupabaseClient(false, token);

        // Проверяем токен и получаем пользователя
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ config: null, error: messages.api.invalidToken });
        }

        // Загружаем конфигурацию игры
        const { data, error } = await supabase
            .from('game_configs')
            .select('droppables')
            .eq('user_id', user.id)
            .eq('game_type', gameType)
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                config: null,
                error: error.message,
            });
        }

        if (!data) {
            return res.status(200).json({ config: null });
        }

        return res.status(200).json({ config: { droppables: data.droppables } });
    } catch (error) {
        return res.status(500).json({
            config: null,
            error: error instanceof Error ? error.message : messages.api.internalError,
        });
    }
}

