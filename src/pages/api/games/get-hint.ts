import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/utils/supabase';
import { generateHintPrompt } from '@/utils/puzzle-hint-prompt';
import { DroppablesConfig } from '@/utils/game-api';
import { getLocaleFromRequest } from '@/utils/i18n-api';
import { getAllMessages } from '@/locales/loadMessages';

type Data = {
    hint: string | null;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    if (req.method !== 'POST') {
        return res.status(405).json({ hint: null, error: messages.api.methodNotAllowed });
    }

    // Проверка авторизации
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ hint: null, error: messages.api.unauthorized });
    }

    const token = authHeader.replace('Bearer ', '');

    // Проверяем токен
    try {
        const supabaseAuth = createServerSupabaseClient(false);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ hint: null, error: messages.api.invalidToken });
        }
    } catch {
        return res.status(401).json({ hint: null, error: messages.api.authenticationFailed });
    }

    // Получаем состояние игры
    const { droppables } = req.body;

    if (!droppables || typeof droppables !== 'object') {
        return res.status(400).json({ hint: null, error: messages.api.droppablesRequired });
    }

    // Формируем промпт на бекенде
    let prompt: string;
    try {
        prompt = generateHintPrompt(droppables as DroppablesConfig, messages.llm);
        // Выводим сформированный промпт в консоль сервера
        console.log('=== Сформированный промпт для LLM ===');
        console.log(prompt);
        console.log('=====================================');
    } catch (error) {
        return res.status(400).json({
            hint: null,
            error: error instanceof Error ? error.message : messages.api.failedToGeneratePrompt,
        });
    }

    const apiKey = process.env.VSEGPT_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            hint: null,
            error: messages.api.vsegptApiKeyNotConfigured,
        });
    }

    try {
        // Используем недорогую модель gpt-3.5-turbo или другую доступную модель
        const model = process.env.VSEGPT_MODEL || 'openai/gpt-3.5-turbo-1106';

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
            return res.status(response.status).json({
                hint: null,
                error: `${messages.api.vsegptApiError}: ${response.statusText}`,
            });
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message) {
            return res.status(500).json({
                hint: null,
                error: messages.api.invalidResponseFormat,
            });
        }

        const hint = data.choices[0].message.content.trim();

        // Выводим ответ LLM в консоль сервера
        console.log('=== Ответ от LLM ===');
        console.log(hint);
        console.log('===================');

        return res.status(200).json({ hint });
    } catch (error) {
        console.error('Error calling VseGPT API:', error);
        return res.status(500).json({
            hint: null,
            error: error instanceof Error ? error.message : messages.api.unknownError,
        });
    }
}

