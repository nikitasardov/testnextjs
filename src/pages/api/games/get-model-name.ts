import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
    modelName: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ modelName: 'AI', error: 'Method not allowed' });
    }

    try {
        // Получаем название модели из переменной окружения
        const model = process.env.VSEGPT_MODEL || 'openai/gpt-3.5-turbo-1106';

        // Форматируем название для отображения
        // Убираем префиксы типа "openai/", "qwen/" и т.д.
        let modelName = model;
        if (model.includes('/')) {
            const parts = model.split('/');
            modelName = parts[parts.length - 1];
        }

        // Преобразуем в читаемый формат
        modelName = modelName
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());

        return res.status(200).json({ modelName });
    } catch (error) {
        return res.status(500).json({
            modelName: 'AI',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

