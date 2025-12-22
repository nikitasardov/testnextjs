
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Button } from '@mui/material';
import { Draggable } from '../components/Draggable';
import { Droppable, isDroppable } from '../components/Droppable';
import { generateDroppables, generateDraggables, shuffleArray } from '../utils/dnd-helpers';
import { withAuth } from "@/components/withAuth";

function DndGame15() {
  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(
    generateDroppables(16, 'Ячейка ')
  );

  const draggableItems = generateDraggables(15, '');

  // Функция для перемешивания элементов
  const shuffleItems = () => {
    const droppableKeys = Object.keys(droppables);
    const shuffledDroppables = shuffleArray(droppableKeys);
    const shuffledItems = shuffleArray(draggableItems.map(item => item.id));

    const shuffledDroppablesState: { [key: string]: { name: string, items: string[] } } = {};

    // Инициализируем все области как пустые
    droppableKeys.forEach(key => {
      shuffledDroppablesState[key] = { ...droppables[key], items: [] };
    });

    // Распределяем элементы по случайным областям
    shuffledItems.forEach((itemId, index) => {
      if (index < shuffledDroppables.length) {
        shuffledDroppablesState[shuffledDroppables[index]].items.push(itemId);
      }
    });

    setDroppables(shuffledDroppablesState);
  };

  // Функция-заглушка для сохранения
  const handleSave = () => {
    console.log('сохранение...');
  };

  // Инициализация случайного распределения элементов при загрузке
  useEffect(() => {
    shuffleItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDragEnd({ active, over }: DragEndEvent) {
    const itemId = active.id as string;
    const droppableId = over?.id as string;

    // Находим, в каком droppable сейчас находится этот элемент (если есть)
    const currentDroppable = Object.keys(droppables).find(
      key => droppables[key].items.includes(itemId)
    );

    // Проверяем, является ли целевая область droppable
    if (isDroppable(droppableId)) {
      // Проверяем, что в droppable меньше 2 элементов
      if (currentDroppable !== droppableId && droppables[droppableId].items.length === 0) {
        setDroppables(prev => {
          const updates = { ...prev };
          // Удаляем элемент из текущего droppable (если есть)
          if (currentDroppable) {
            updates[currentDroppable] = {
              ...prev[currentDroppable],
              items: prev[currentDroppable].items.filter(id => id !== itemId)
            };
          }
          // Добавляем элемент в новый droppable (если его там еще нет)
          if (!updates[droppableId].items.includes(itemId)) {
            updates[droppableId].items = [...updates[droppableId].items, itemId];
          }
          return updates;
        });
      }
    } else if (currentDroppable) {
      // Если элемент перетащили не в droppable, удаляем его из текущего droppable
      setDroppables(prev => ({
        ...prev,
        [currentDroppable]: {
          ...prev[currentDroppable],
          items: prev[currentDroppable].items.filter(id => id !== itemId)
        },
      }));
    }
  }

  const droppedItems = new Set(Object.values(droppables).flatMap(droppable => droppable.items));

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

            {Object.keys(droppables).map(droppableId => (
              <Droppable key={droppableId} id={droppableId} noOpacity={true}>
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
                  {droppables[droppableId].items.length > 0
                    ? (
                      droppables[droppableId].items.map(itemId => (
                        <Draggable key={itemId} id={itemId}>
                          {draggableItems.find(i => i.id === itemId)?.name}
                        </Draggable>
                      ))
                    )
                    : (
                      <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>{droppables[droppableId].name}</p>
                    )
                  }
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
          <Button
            variant="contained"
            onClick={shuffleItems}
            sx={{ mb: 2, backgroundColor: 'red', '&:hover': { backgroundColor: '#d32f2f' } }}
          >
            Перемешать
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ mb: 2, backgroundColor: 'green', '&:hover': { backgroundColor: '#2e7d32' } }}
          >
            Сохранить
          </Button>
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

export default withAuth(DndGame15);