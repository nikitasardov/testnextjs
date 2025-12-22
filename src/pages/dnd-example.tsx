
import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Draggable } from '../components/Draggable';
import { Droppable, isDroppable } from '../components/Droppable';
import * as Msg from '../components/Notifications';
import { generateDroppables, generateDraggables } from '../utils/dnd-helpers';
import { withAuth } from '@/components/withAuth';

function DndExample() {
  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(
    generateDroppables(4)
  );
  const maxItemsPerDroppable = 3;
  const draggableItems = generateDraggables(13);

  function handleDragStart({ active }: DragStartEvent) {
    const activeDraggable = draggableItems.find(item => item.id === active.id);

    Msg.notify(`Вы потащили элемент <b>${activeDraggable?.name}</b>`);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    const activeDraggable = draggableItems.find(item => item.id === active.id);
    const overDroppable = droppables[over?.id as string];
    const overDroppableKey = over?.id as string;
    const itemId = active.id as string;
    const currentDroppableKey = Object.keys(droppables).find(
      key => droppables[key].items.includes(itemId)
    );
    const isParent = currentDroppableKey == overDroppableKey;

    if (isDroppable(overDroppableKey)) {
      if (!isParent && droppables[overDroppableKey].items.length < maxItemsPerDroppable) {

        Msg.notify(`<b>${activeDraggable?.name}</b> находится над <b>${overDroppable?.name}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {

        Msg.attention(`В <b>${overDroppable?.name}</b> больше нет места.`);
      }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const itemId = active.id as string;
    const overDroppableKey = over?.id as string;
    const overDroppable = droppables[overDroppableKey];

    // Находим, в каком droppable сейчас находится этот элемент (если есть)
    const currentDroppableKey = Object.keys(droppables).find(
      key => droppables[key].items.includes(itemId)
    );

    const activeDraggable = draggableItems.find(item => item.id === active.id);
    const isParent = currentDroppableKey == overDroppableKey;

    // Проверяем, является ли целевая область droppable
    if (isDroppable(overDroppableKey)) {
      // Проверяем, что в droppable есть место для элемента
      if (!isParent && droppables[overDroppableKey].items.length < maxItemsPerDroppable) {
        setDroppables(prev => {
          const updates = { ...prev };
          // Удаляем элемент из текущего droppable (если есть)
          if (currentDroppableKey) {
            updates[currentDroppableKey] = {
              ...prev[currentDroppableKey],
              items: prev[currentDroppableKey].items.filter(id => id !== itemId)
            };
          }
          // Добавляем элемент в новый droppable (если его там еще нет)
          if (!updates[overDroppableKey].items.includes(itemId)) {
            updates[overDroppableKey].items = [...updates[overDroppableKey].items, itemId];
          }
          return updates;
        });

        Msg.success(`<b>${activeDraggable?.name}</b> перемещен в <b>${overDroppable.name}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {

        Msg.warn(`В <b>${overDroppable.name}</b> нет свободных мест. Перетащите элемент в другую область.`);
      }
    } else if (currentDroppableKey) {
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable
      setDroppables(prev => ({
        ...prev,
        [currentDroppableKey]: {
          ...prev[currentDroppableKey],
          items: prev[currentDroppableKey].items.filter(id => id !== itemId)
        },
      }));

      Msg.success(`Вы убрали <b>${activeDraggable?.name}</b> из <b>${droppables[currentDroppableKey].name}</b>`);
    } else if (!currentDroppableKey) {
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable

      Msg.notify(`Вы передумали перетаскивать элемент <b>${activeDraggable?.name}</b>`);
    }
  }

  const droppedItems = new Set(Object.values(droppables).flatMap(droppable => droppable.items));

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} onDragOver={handleDragOver}>
        <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: '50vh' }}>
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

              {Object.keys(droppables).map(droppableId => (
                <Droppable key={droppableId} id={droppableId}>
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
                    {droppables[droppableId].items.length > 0
                      ? (
                        droppables[droppableId].items.map(itemId => (
                          <Draggable key={itemId} id={itemId}>
                            {draggableItems.find(i => i.id === itemId)?.name}
                          </Draggable>
                        ))
                      )
                      : (
                        <p style={{ color: '#999', margin: 0 }}>{droppables[droppableId].name}</p>
                      )
                    }
                  </div>
                </Droppable>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '20px' }}>
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
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '200px'
          }}>
            <Msg.Notifications />
          </div>
        </div>
      </DndContext>
    </div>
  );
}

// Экспортируем обернутый компонент
export default withAuth(DndExample);