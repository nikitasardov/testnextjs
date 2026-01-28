import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/utils/supabase';
import { generateHintPrompt, formatBoardStateForTelegram, getBoardState } from '@/utils/puzzle-hint-prompt';
import { DroppablesConfig } from '@/utils/game-api';
import { getLocaleFromRequest } from '@/utils/i18n-api';
import { getAllMessages } from '@/locales/loadMessages';
import { sendTelegramMessage } from '@/utils/telegram-api';
import { formatHintForTelegram } from '@/utils/format-hint';
import { authenticateRequest, type AuthenticatedRequest } from '@/utils/auth-middleware';
import { ApiError, ApiErrorCode } from '@/utils/api-error';
import { handleApiError } from '@/utils/api-error-handler';

type Data = {
    hint: string | null;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== 'POST') {
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

        // Получаем состояние игры
        const { droppables } = req.body;

        if (!droppables || typeof droppables !== 'object') {
            throw new ApiError(ApiErrorCode.MISSING_PARAMETER, messages.api.droppablesRequired);
        }

        // Формируем промпт на бекенде
        let prompt: string;
        try {
            prompt = generateHintPrompt(droppables as DroppablesConfig, messages.llm);
        } catch (error) {
            throw new ApiError(
                ApiErrorCode.VALIDATION_ERROR,
                messages.api.failedToGeneratePrompt,
                400,
                error instanceof Error ? error : undefined
            );
        }
        // Выводим сформированный промпт в консоль сервера
        console.log('=== Сформированный промпт для LLM ===');
        console.log(prompt);
        console.log('=====================================');

        const apiKey = process.env.VSEGPT_API_KEY;

        if (!apiKey) {
            throw new ApiError(
                ApiErrorCode.VSEGPT_API_KEY_NOT_CONFIGURED,
                messages.api.vsegptApiKeyNotConfigured
            );
        }

        // Используем недорогую модель gpt-3.5-turbo или другую доступную модель
        const model = process.env.VSEGPT_MODEL || 'openai/gpt-3.5-turbo';

        const response = await fetch('https://api.vsegpt.ru:6070/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 150, // Ограничиваем длину ответа для экономии
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('VseGPT API error:', response.status, errorText);
            throw new ApiError(
                ApiErrorCode.VSEGPT_API_ERROR,
                `${messages.api.vsegptApiError}: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message) {
            throw new ApiError(
                ApiErrorCode.VSEGPT_INVALID_RESPONSE,
                messages.api.invalidResponseFormat
            );
        }

        const hint = data.choices[0].message.content.trim();

        // Выводим ответ LLM в консоль сервера
        console.log('=== Ответ от LLM ===');
        console.log(hint);
        console.log('===================');

        // Отправляем подсказку в Telegram, если у пользователя настроены уведомления
        // Делаем это асинхронно, чтобы не блокировать ответ пользователю
        if (user) {
            (async () => {
                try {
                    const supabase = createServerSupabaseClient(false, token);
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('telegram_bot_token, telegram_chat_id')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (settings?.telegram_bot_token && settings?.telegram_chat_id) {
                        // Форматируем подсказку через LLM для красивого отображения в Telegram
                        const formattedHint = await formatHintForTelegram(hint, messages.llm);

                        // Форматируем схему доски для Telegram
                        const board = getBoardState(droppables as DroppablesConfig);
                        const board4x4: number[][] = Array.from({ length: 4 }, (_, row) =>
                            board.slice(row * 4, (row + 1) * 4)
                        );
                        const boardText = formatBoardStateForTelegram(board4x4);

                        const telegramMessage = `🎮 <b>${messages.llm.telegramHintTitle}</b>\n\n${boardText}\n\n${formattedHint}`;
                        const result = await sendTelegramMessage(
                            settings.telegram_bot_token,
                            settings.telegram_chat_id,
                            telegramMessage
                        );

                        if (result.success) {
                            console.log('Подсказка успешно отправлена в Telegram');
                        } else {
                            console.error('Ошибка отправки подсказки в Telegram:', result.error);
                        }
                    }
                } catch (error) {
                    // Игнорируем ошибки отправки в Telegram, чтобы не влиять на основной функционал
                    console.error('Ошибка при отправке подсказки в Telegram:', error);
                }
            })();
        }

        return res.status(200).json({ hint });
    } catch (error) {
        handleApiError(error, req, res, { hint: null });
    }
}

