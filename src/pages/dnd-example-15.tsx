
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Draggable } from '../components/Draggable';
import { Droppable } from '../components/Droppable';

// Функция для перемешивания массива
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Функция для генерации областей droppable
function generateQuadrants(count: number): { [key: string]: { name: string, items: string[] } } {
  const quadrants: { [key: string]: { name: string, items: string[] } } = {};
  for (let i = 1; i <= count; i++) {
    quadrants[`quadrant${i}`] = { name: `Область ${i}`, items: [] };
  }
  return quadrants;
}

// Функция для генерации элементов draggable
function generateDraggableItems(count: number): Array<{ id: string, name: string }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `el${i + 1}`,
    name: `${i + 1}`,
  }));
}

export default function DndExample() {
  const [quadrants, setQuadrants] = useState<{ [key: string]: { name: string, items: string[] } }>(
    generateQuadrants(16)
  );

  const draggableItems = generateDraggableItems(15);

  // Инициализация случайного распределения элементов при загрузке
  useEffect(() => {
    const quadrantKeys = Object.keys(quadrants);
    const shuffledQuadrants = shuffleArray(quadrantKeys);
    const shuffledItems = shuffleArray(draggableItems.map(item => item.id));

    const initialQuadrants: { [key: string]: { name: string, items: string[] } } = {};

    // Инициализируем все области как пустые
    quadrantKeys.forEach(key => {
      initialQuadrants[key] = { ...quadrants[key], items: [] };
    });

    // Распределяем элементы по случайным областям
    shuffledItems.forEach((itemId, index) => {
      if (index < shuffledQuadrants.length) {
        initialQuadrants[shuffledQuadrants[index]].items.push(itemId);
      }
    });

    setQuadrants(initialQuadrants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDragEnd({ active, over }: DragEndEvent) {
    const itemId = active.id as string;
    const quadrantId = over?.id as string;

    // Находим, в каком квадранте сейчас находится этот элемент (если есть)
    const currentQuadrant = Object.keys(quadrants).find(
      key => quadrants[key].items.includes(itemId)
    );

    // Проверяем, является ли целевая область квадрантом
    if (quadrantId?.startsWith('quadrant')) {
      // Проверяем, что в квадранте меньше 2 элементов
      if (currentQuadrant !== quadrantId && quadrants[quadrantId].items.length === 0) {
        setQuadrants(prev => {
          const updates = { ...prev };
          // Удаляем элемент из текущего квадранта (если есть)
          if (currentQuadrant) {
            updates[currentQuadrant] = {
              ...prev[currentQuadrant],
              items: prev[currentQuadrant].items.filter(id => id !== itemId)
            };
          }
          // Добавляем элемент в новый квадрант (если его там еще нет)
          if (!updates[quadrantId].items.includes(itemId)) {
            updates[quadrantId].items = [...updates[quadrantId].items, itemId];
          }
          return updates;
        });
      }
    } else if (currentQuadrant) {
      // Если элемент перетащен не в квадрант, удаляем его из текущего квадранта
      setQuadrants(prev => ({
        ...prev,
        [currentQuadrant]: {
          ...prev[currentQuadrant],
          items: prev[currentQuadrant].items.filter(id => id !== itemId)
        },
      }));
    }
  }

  const droppedItems = new Set(Object.values(quadrants).flatMap(quadrant => quadrant.items));

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: '25vh' }}>
      <DndContext onDragEnd={handleDragEnd}>
        <div style={{ flex: 1 }}>
          <div style={{
            minHeight: '500px',
            border: '2px solid #333',
            borderRadius: '8px',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr 1fr 1fr',
            gap: '2px',
            backgroundColor: '#333',
            padding: '2px'
          }}>

            {Object.keys(quadrants).map(quadrantId => (
              <Droppable key={quadrantId} id={quadrantId} noOpacity={true}>
                <div style={{
                  minHeight: '100%',
                  padding: '8px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  {quadrants[quadrantId].items.length > 0 ? (
                    quadrants[quadrantId].items.map(itemId => (
                      <Draggable key={itemId} id={itemId}>
                        {draggableItems.find(i => i.id === itemId)?.name}
                      </Draggable>
                    ))
                  ) : (
                    <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>{quadrants[quadrantId].name}</p>
                  )}
                </div>
              </Droppable>
            ))}

          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '200px'
        }}>
          {draggableItems.map(item => {
            if (!droppedItems.has(item.id)) {
              return (
                <Draggable key={item.id} id={item.id}>
                  {item.name}
                </Draggable>
              );
            }
            return null;
          })}
        </div>
      </DndContext>
    </div>
  );
}
