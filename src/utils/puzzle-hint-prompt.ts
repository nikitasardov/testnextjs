import { DroppablesConfig } from './game-api';

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
 * @returns текстовое представление доски
 */
function formatBoardState(board: number[][]): string {
    let boardText = 'Текущее состояние доски (4x4):\n';
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
    boardText += '\n(где _ обозначает пустую ячейку)\n';
    return boardText;
}

/**
 * Генерирует промпт для LLM для получения подсказки по игре 15-puzzle
 * @param droppables - текущее состояние игры
 * @returns промпт для отправки в LLM
 */
export function generateHintPrompt(droppables: DroppablesConfig): string {
    // Преобразуем droppables в массив массивов
    const board = getBoardState(droppables);
    const board4x4: number[][] = [];
    for (let row = 0; row < 4; row++) {
        board4x4.push(board.slice(row * 4, (row + 1) * 4));
    }
    const boardText = formatBoardState(board4x4);

    const prompt = `Ты помощник для игры "15-puzzle". Порекомендуй ТРИ следующих хода подряд.

Правила: доска 4×4, 15 плиток (1-15), одна ячейка пустая (_). Плитку можно переместить только в соседнюю пустую ячейку. Цель: расположить плитки 1-15 слева направо, сверху вниз.

${boardText}

Алгоритм:
1. Найди пустую ячейку (0) и плитки, соседствующие с ней (сверху/снизу/слева/справа) - это доступные ходы для первого шага. Выбери первый оптимальный ход.
2. Мысленно выполни первый ход: перемести выбранную плитку в пустую ячейку. Пустая ячейка окажется на месте этой плитки.
3. Определи новое положение пустой ячейки и найди соседние плитки - это доступные ходы для второго шага. Выбери второй оптимальный ход.
4. Мысленно выполни второй ход: перемести выбранную плитку в пустую ячейку. Пустая ячейка окажется на месте плитки, которую ты переместил.
5. Определи новое положение пустой ячейки и найди соседние плитки - это доступные ходы для третьего шага. Выбери третий оптимальный ход.

Требования:
- Плитку можно переместить ТОЛЬКО если она соседствует с пустой ячейкой
- После трех ходов доска НЕ должна вернуться в начальное состояние
- Не создавай циклы (туда-сюда одной плиткой)

Формат ответа: "1. Переместите плитку [номер] [направление], 2. Переместите плитку [номер] [направление], 3. Переместите плитку [номер] [направление]"
Пример: "1. Переместите плитку 8 вверх, 2. Переместите плитку 3 вправо, 3. Переместите плитку 1 вниз"

ЗАПРЕЩЕНО: рассуждения, перечисление данных, объяснения, комментарии.

Ответь СТРОГО ТОЛЬКО одной фразой с тремя ходами. Ничего больше.`;

    return prompt;
}

