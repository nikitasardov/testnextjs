import type { Messages } from '@/locales/messages';

function normalizeTelegramFormattedText(text: string): string {
    const withoutFences = text
        .replace(/^```[a-zA-Z]*\n?/, '')
        .replace(/```$/, '')
        .trim();

    // LLM иногда возвращает литералы "\n" вместо реальных переносов строк
    return withoutFences.replaceAll(String.raw`\n`, '\n');
}

/**
 * Форматирует подсказку для отправки в Telegram через LLM
 * @param hint - исходная подсказка от LLM
 * @param llmMessages - сообщения для локализации
 * @returns Promise с отформатированной подсказкой или исходной, если форматирование не удалось
 */
export async function formatHintForTelegram(
    hint: string,
    llmMessages: Messages['llm']
): Promise<string> {
    const apiKey = process.env.VSEGPT_API_KEY;
    if (!apiKey) {
        console.warn('VSEGPT_API_KEY not configured, returning original hint');
        return hint;
    }

    const model = process.env.VSEGPT_MODEL_FORMATTER || 'openai/gpt-3.5-turbo';
    const formatPrompt = llmMessages.telegramFormatPrompt.replace('{hint}', hint);

    console.log('=== Форматирование подсказки для Telegram ===');
    console.log('Исходная подсказка:', hint);
    console.log('Используемая модель:', model);
    console.log('Промпт форматтера (первые 500 символов):', formatPrompt.substring(0, 500));
    console.log('=============================================');

    try {
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
                        content: formatPrompt,
                    },
                ],
                max_tokens: 400, // Увеличено для полного форматирования с эмодзи
                temperature: 0.4, // Низкая температура для более детерминированного форматирования
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('VseGPT API error during formatting:', response.status, errorText);
            console.error('Модель, которая вызвала ошибку:', model);
            return hint;
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message?.content) {
            console.error('Invalid response format during formatting');
            return hint;
        }

        const formattedHint = normalizeTelegramFormattedText(data.choices[0].message.content.trim());
        console.log('=== Форматированная подсказка для Telegram ===');
        console.log(formattedHint);
        console.log('=============================================');

        return formattedHint;
    } catch (error) {
        console.error('Error formatting hint for Telegram:', error);
        return hint;
    }
}

