import { supabase } from './supabase';
import { DroppablesConfig } from './game-api';

/**
 * Получает подсказку от LLM через API route
 * @param droppables - текущее состояние игры
 * @returns Promise с подсказкой или ошибкой
 */
export async function getHintFromLLM(droppables: DroppablesConfig): Promise<{ hint: string | null; error?: string }> {
    try {
        // Получаем токен авторизации
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                hint: null,
                error: 'Не авторизован. Войдите в систему для получения подсказок.',
            };
        }

        const response = await fetch('/api/games/get-hint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ droppables }),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                hint: null,
                error: result.error || 'Ошибка при получении подсказки',
            };
        }

        return { hint: result.hint };
    } catch (error) {
        return {
            hint: null,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        };
    }
}

