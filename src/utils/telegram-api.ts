/**
 * Отправляет сообщение в Telegram через бота
 * @param botToken - токен Telegram бота
 * @param chatId - ID чата для отправки сообщения
 * @param message - текст сообщения
 * @returns Promise с результатом отправки
 */
export async function sendTelegramMessage(
    botToken: string,
    chatId: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML', // Поддержка HTML форматирования
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.description || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

