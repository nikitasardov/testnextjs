import { DroppablesConfig } from './game-api';
import type { Messages } from '@/locales/messages';

/**
 * Преобразует состояние droppables в массив board для проверки решаемости
 */
export function getBoardState(droppables: DroppablesConfig): number[] {
    const board: number[] = [];
    const droppableKeys = Object.keys(droppables).sort((a, b) => {
        const numA = Number.parseInt(a.replace('droppable', ''), 10);
        const numB = Number.parseInt(b.replace('droppable', ''), 10);
        return numA - numB;
    });

    droppableKeys.forEach(droppableId => {
        const droppable = droppables[droppableId];
        if (droppable.items.length > 0) {
            const itemId = droppable.items[0];
            const num = Number.parseInt(itemId.replace('draggable', ''), 10);
            board.push(num);
        } else {
            board.push(0);
        }
    });

    return board;
}

/**
 * Функция для проверки решаемости комбинации "15-puzzle"
 * Принимает массив из 16 элементов, где 0 - пустая клетка
 */
export function isSolvable(board: number[]): boolean {
    if (board.length !== 16) {
        throw new Error('Доска должна быть 4×4 (16 элементов).');
    }

    // 1. Собираем последовательность без пустой клетки (0)
    const tiles = board.filter(x => x !== 0);

    // 2. Считаем инверсии (I)
    const inversions = tiles.reduce((count, tile, i) => {
        return count + tiles.slice(i + 1).filter(otherTile => tile > otherTile).length;
    }, 0);

    // 3. Находим строку пустой клетки снизу (emptyRowFromBottom)
    const emptyIndex = board.indexOf(0);
    const emptyRowFromTop = Math.floor(emptyIndex / 4);
    const emptyRowFromBottom = 4 - emptyRowFromTop;

    // 4. Для доски 4×4: решаема ⇔ (inversions + emptyRowFromBottom) — нечётно
    return (inversions + emptyRowFromBottom) % 2 === 1;
}

/**
 * Преобразует массив массивов 4x4 в текстовое представление для промпта
 * @param board - массив 4x4, где 0 - пустая ячейка
 * @param llmMessages - сообщения для локализации
 * @returns текстовое представление доски
 */
function formatBoardState(board: number[][], llmMessages: Messages['llm']): string {
    // Форматируем с выравниванием: каждое число занимает 2 символа
    const rowsText = board.map(row =>
        row.map(value => {
            const str = value === 0 ? '_' : value.toString();
            return str.padStart(2, ' '); // Выравниваем по правому краю (2 символа)
        }).join(' | ')
    ).join('\n');

    return `${llmMessages.hintPromptBoardState}\n${rowsText}\n\n${llmMessages.hintPromptEmptyCell}\n`;
}

/**
 * Преобразует массив массивов 4x4 в форматированное представление для Telegram
 * @param board - массив 4x4, где 0 - пустая ячейка
 * @returns форматированное представление доски для Telegram (с моноширинным шрифтом)
 */
export function formatBoardStateForTelegram(board: number[][]): string {
    // Форматируем с выравниванием: каждое число занимает 2 символа
    const rowsText = board.map(row =>
        row.map(value => {
            const str = value === 0 ? '_' : value.toString();
            return str.padStart(2, ' '); // Выравниваем по правому краю (2 символа)
        }).join(' | ')
    ).join('\n');

    // Используем моноширинный шрифт для лучшего отображения в Telegram
    return `<code>${rowsText}</code>`;
}

/**
 * Генерирует промпт для LLM для получения подсказки по игре 15-puzzle
 * @param droppables - текущее состояние игры
 * @param llmMessages - сообщения для локализации
 * @returns промпт для отправки в LLM
 */
export function generateHintPrompt(droppables: DroppablesConfig, llmMessages: Messages['llm']): string {
    // Преобразуем droppables в массив массивов
    const board = getBoardState(droppables);
    const board4x4: number[][] = Array.from({ length: 4 }, (_, row) =>
        board.slice(row * 4, (row + 1) * 4)
    );
    const boardText = formatBoardState(board4x4, llmMessages);

    const prompt = `${llmMessages.hintPromptTitle}

${llmMessages.hintPromptRules}

${boardText}

${llmMessages.hintPromptAlgorithm}
${llmMessages.hintPromptAlgorithm1}
${llmMessages.hintPromptAlgorithm2}
${llmMessages.hintPromptAlgorithm3}
${llmMessages.hintPromptAlgorithm4}
${llmMessages.hintPromptAlgorithm5}

${llmMessages.hintPromptRequirements}
${llmMessages.hintPromptRequirements1}
${llmMessages.hintPromptRequirements2}
${llmMessages.hintPromptRequirements3}

${llmMessages.hintPromptFormat}
${llmMessages.hintPromptExample}

${llmMessages.hintPromptForbidden}

${llmMessages.hintPromptAnswer}`;

    return prompt;
}

