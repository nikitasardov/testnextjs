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
    let inversions = 0;
    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i] > tiles[j]) {
                inversions++;
            }
        }
    }

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
    let boardText = `${llmMessages.hintPromptBoardState}\n`;
    for (let row = 0; row < 4; row++) {
        const rowValues: string[] = [];
        for (let col = 0; col < 4; col++) {
            const value = board[row][col];
            if (value === 0) {
                rowValues.push('_');
            } else {
                rowValues.push(value.toString());
            }
        }
        boardText += rowValues.join(' | ') + '\n';
    }
    boardText += `\n${llmMessages.hintPromptEmptyCell}\n`;
    return boardText;
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
    const board4x4: number[][] = [];
    for (let row = 0; row < 4; row++) {
        board4x4.push(board.slice(row * 4, (row + 1) * 4));
    }
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

