// Функция для перемешивания массива
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    Array.from({ length: shuffled.length - 1 }, (_, index) => {
        const i = shuffled.length - 1 - index;
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    });
    return shuffled;
}

// Функция для генерации областей droppable
export function generateDroppables(count: number, namePrefix: string = 'Область '): { [key: string]: { name: string, items: string[] } } {
    return Object.fromEntries(
        Array.from({ length: count }, (_, index) => {
            const i = index + 1;
            return [`droppable${i}`, { name: `${namePrefix}${i}`, items: [] }];
        })
    ) as { [key: string]: { name: string, items: string[] } };
}

// Функция для генерации элементов draggable
export function generateDraggables(count: number, namePrefix: string = 'Элемент '): Array<{ id: string, name: string }> {
    return Array.from({ length: count }, (_, i) => ({
        id: `draggable${i + 1}`,
        name: `${namePrefix}${i + 1}`,
    }));
}