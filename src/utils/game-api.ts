import { supabase } from './supabase';

export type GameType = 'example' | '15-puzzle';

export type DroppablesConfig = { [key: string]: { name: string, items: string[] } };

export type GameConfig = {
    droppables: DroppablesConfig;
};

/**
 * Сохраняет конфигурацию игры в Supabase
 * @param gameType - тип игры ('example' или '15-puzzle')
 * @param droppables - конфигурация droppables
 * @returns Promise с результатом сохранения
 */
export async function saveGameConfig(
    gameType: GameType,
    droppables: DroppablesConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return { success: false, error: 'Не авторизован' };
        }

        const response = await fetch('/api/games/save-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                gameType,
                droppables,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, error: result.error || 'Ошибка сохранения' };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        };
    }
}

/**
 * Загружает конфигурацию игры из Supabase
 * @param gameType - тип игры ('example' или '15-puzzle')
 * @returns Promise с конфигурацией игры или null, если не найдено
 */
export async function loadGameConfig(
    gameType: GameType
): Promise<{ config: GameConfig | null; error?: string }> {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return { config: null, error: 'Не авторизован' };
        }

        const response = await fetch(`/api/games/load-game?gameType=${gameType}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return { config: null, error: result.error || 'Ошибка загрузки' };
        }

        return { config: result.config };
    } catch (error) {
        return {
            config: null,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        };
    }
}

