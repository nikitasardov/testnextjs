
import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Draggable } from '../components/Draggable';
import { Droppable } from '../components/Droppable';
import { Notifications, addNotification, addWarning } from '../components/Notifications';

export default function DndExample() {
  const [quadrants, setQuadrants] = useState<{ [key: string]: { name: string, items: string[] } }>({
    quadrant1: { name: 'Область 1', items: [] },
    quadrant2: { name: 'Область 2', items: [] },
    quadrant3: { name: 'Область 3', items: [] },
    quadrant4: { name: 'Область 4', items: [] },
  });

  const draggableItems = [
    { id: 'el1', name: 'Элемент 1' },
    { id: 'el2', name: 'Элемент 2' },
    { id: 'el3', name: 'Элемент 3' },
    { id: 'el4', name: 'Элемент 4' },
    { id: 'el5', name: 'Элемент 5' },
    { id: 'el6', name: 'Элемент 6' },
    { id: 'el7', name: 'Элемент 7' },
    { id: 'el8', name: 'Элемент 8' },
    { id: 'el9', name: 'Элемент 9' },
  ];

  function handleDragStart({ active }: DragStartEvent) {
    addNotification(`Вы потащили элемент ${active.id}`);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    addNotification(`Элемент ${active.id} находится над ${over?.id}`);
  }

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
      if (currentQuadrant !== quadrantId && quadrants[quadrantId].items.length < 2) {
        addNotification(`Элемент ${active.id} перетащен в ${over?.id}`);
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
      } else if (currentQuadrant !== quadrantId && quadrants[quadrantId].items.length >= 2) {
        addWarning(`В квадранте ${quadrantId} уже 2 элемента. Перетащите элемент в другой квадрант.`);
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
    } else if (!currentQuadrant) {
      // Если элемент перетащен не в квадрант, удаляем его из текущего квадранта
      addNotification(`Вы передумали перетаскивать элемент ${active.id}`);
    }
  } 

  const droppedItems = new Set(Object.values(quadrants).flatMap(quadrant => quadrant.items));

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: '50vh' }}>
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} onDragOver={handleDragOver}>
          <div style={{ flex: 1 }}>
            <div style={{
              minHeight: '500px',
              border: '2px solid #333',
              borderRadius: '8px',
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '2px',
              backgroundColor: '#333',
              padding: '2px'
            }}>
              {/* Вертикальная ось */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: '#333',
                transform: 'translateX(-50%)',
                zIndex: 1
              }} />
              {/* Горизонтальная ось */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#333',
                transform: 'translateY(-50%)',
                zIndex: 1
              }} />

            {Object.keys(quadrants).map(quadrantId => (
              <Droppable key={quadrantId} id={quadrantId}>
                <div style={{
                  minHeight: '100%',
                  padding: '20px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {quadrants[quadrantId].items.length > 0 ? (
                    quadrants[quadrantId].items.map(itemId => (
                      <Draggable key={itemId} id={itemId}>
                        {draggableItems.find(i => i.id === itemId)?.name}
                      </Draggable>
                    ))
                  ) : (
                    <p style={{ color: '#999', margin: 0 }}>{quadrants[quadrantId].name}</p>
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
      <Notifications />
    </div>
  );
}
