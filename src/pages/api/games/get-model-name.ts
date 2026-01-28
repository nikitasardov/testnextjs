import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, ApiErrorCode } from '@/utils/api-error';
import { handleApiError } from '@/utils/api-error-handler';
import { getLocaleFromRequest } from '@/utils/i18n-api';
import { getAllMessages } from '@/locales/loadMessages';

type Data = {
    modelName: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    try {
        const locale = getLocaleFromRequest(req);
        const messages = getAllMessages(locale);

        if (req.method !== 'GET') {
            throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
        }

        // Получаем название модели из переменной окружения
        const model = process.env.VSEGPT_MODEL || 'openai/gpt-3.5-turbo';

        // Форматируем название для отображения
        // Убираем префиксы типа "openai/", "qwen/" и т.д.
        const baseModelName = model.includes('/')
            ? model.split('/').at(-1)!
            : model;

        // Преобразуем в читаемый формат
        const modelName = baseModelName
            .replaceAll('-', ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());

        return res.status(200).json({ modelName });
    } catch (error) {
        handleApiError(error, req, res, { modelName: 'AI' });
    }
}

