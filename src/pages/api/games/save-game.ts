import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";

type Data = {
    success: boolean;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { gameType, droppables } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!gameType || !droppables) {
        return res.status(400).json({ success: false, error: "gameType and droppables are required" });
    }

    if (gameType !== 'example' && gameType !== '15-puzzle') {
        return res.status(400).json({ success: false, error: "Invalid gameType" });
    }

    try {
        // Создаем клиент для проверки токена
        const supabaseAuth = createServerSupabaseClient(false);

        // Проверяем токен и получаем пользователя
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
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
            return res.status(500).json({
                success: false,
                error: upsertError.message,
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
}

