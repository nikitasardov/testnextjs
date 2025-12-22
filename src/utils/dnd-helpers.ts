// Функция для перемешивания массива
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Функция для генерации областей droppable
export function generateDroppables(count: number, namePrefix: string = 'Область '): { [key: string]: { name: string, items: string[] } } {
    const droppables: { [key: string]: { name: string, items: string[] } } = {};
    for (let i = 1; i <= count; i++) {
        droppables[`droppable${i}`] = { name: `${namePrefix}${i}`, items: [] };
    }
    return droppables;
}

// Функция для генерации элементов draggable
export function generateDraggables(count: number, namePrefix: string = 'Элемент '): Array<{ id: string, name: string }> {
    return Array.from({ length: count }, (_, i) => ({
        id: `draggable${i + 1}`,
        name: `${namePrefix}${i + 1}`,
    }));
}