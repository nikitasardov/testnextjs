
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Draggable } from '@/components/Draggable';
import { Droppable, isDroppable } from '@/components/Droppable';
import * as Notifications from '@/components/Notifications';
import { generateDroppables, generateDraggables } from '@/utils/dnd-helpers';
import { withAuth } from '@/components/withAuth';
import { saveGameConfig, loadGameConfig } from '@/utils/game-api';
import styles from './example.module.css';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function DndExample() {
  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(
    generateDroppables(4)
  );
  const [isLoading, setIsLoading] = useState(true);
  const maxItemsPerDroppable = 3;
  const draggableItems = generateDraggables(13);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Загрузка конфигурации при монтировании
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      const { config, error } = await loadGameConfig('example');
      if (error) {
        console.error('Ошибка загрузки конфигурации:', error);
      } else if (config) {
        setDroppables(config.droppables);
      }
      setIsLoading(false);
    };
    loadConfig();
  }, []);
  function handleDragStart({ active }: DragStartEvent) {
    const activeDraggable = draggableItems.find(item => item.id === active.id);

    Notifications.notify(`Вы потащили элемент <b>${activeDraggable?.name}</b>`);
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

        Notifications.notify(`<b>${activeDraggable?.name}</b> находится над <b>${overDroppable?.name}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {

        Notifications.attention(`В <b>${overDroppable?.name}</b> больше нет места.`);
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
          // Сохраняем конфигурацию после изменения
          saveGameConfig('example', updates).catch(error => {
            console.error('Ошибка сохранения:', error);
          });
          return updates;
        });

        Notifications.success(`<b>${activeDraggable?.name}</b> перемещен в <b>${overDroppable.name}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {

        Notifications.warn(`В <b>${overDroppable.name}</b> нет свободных мест. Перетащите элемент в другую область.`);
      }
    } else if (currentDroppableKey) {
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable
      setDroppables(prev => {
        const updates = {
          ...prev,
          [currentDroppableKey]: {
            ...prev[currentDroppableKey],
            items: prev[currentDroppableKey].items.filter(id => id !== itemId)
          },
        };
        // Сохраняем конфигурацию после изменения
        saveGameConfig('example', updates).catch(error => {
          console.error('Ошибка сохранения:', error);
        });
        return updates;
      });

      Notifications.success(`Вы убрали <b>${activeDraggable?.name}</b> из <b>${droppables[currentDroppableKey].name}</b>`);
    } else if (!currentDroppableKey) {
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable

      Notifications.notify(`Вы передумали перетаскивать элемент <b>${activeDraggable?.name}</b>`);
    }
  }

  const droppedItems = new Set(Object.values(droppables).flatMap(droppable => droppable.items));

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} onDragOver={handleDragOver}>
        <div className={styles.container}>
          <div className={styles.gameSection}>
            <div className={styles.gameBoard}>
              {Object.keys(droppables).map(droppableId => (
                <Droppable key={droppableId} id={droppableId}>
                  <div className={styles.cell}>
                    {droppables[droppableId].items.length > 0
                      ? (
                        droppables[droppableId].items.map(itemId => (
                          <Draggable key={itemId} id={itemId}>
                            {draggableItems.find(i => i.id === itemId)?.name}
                          </Draggable>
                        ))
                      )
                      : (
                        <p className={styles.emptyCellText}>{droppables[droppableId].name}</p>
                      )
                    }
                  </div>
                </Droppable>
              ))}
            </div>
            <div className={styles.itemsContainer}>
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
          {
            !isMobile && (
              <div className={styles.notificationsContainer}>
                <Notifications.Container />
              </div>
            )
          }
        </div>
      </DndContext>
      {
        isMobile && (
          <div className={styles.notificationsContainer}>
            <Notifications.Container />
          </div>
        )
      }
    </div>
  );
}

// Экспортируем обернутый компонент
export default withAuth(DndExample);