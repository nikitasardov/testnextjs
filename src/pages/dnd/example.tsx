
import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Draggable } from '@/components/Draggable';
import { Droppable, isDroppable } from '@/components/Droppable';
import * as Notifications from '@/components/Notifications';
import { generateDroppables, generateDraggables } from '@/utils/dnd-helpers';
import { withAuth } from '@/components/withAuth';
import { saveGameConfig, loadGameConfig } from '@/utils/game-api';
import { useTranslations } from 'next-intl';
import styles from './example.module.css';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function DndExample() {
  const t = useTranslations('game');
  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(() => {
    return generateDroppables(4, ''); // Пустой префикс, название будет вычисляться при рендеринге
  });
  const [isLoading, setIsLoading] = useState(true);
  const loadConfigRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxItemsPerDroppable = 3;
  const draggableItems = generateDraggables(13, ''); // Пустой префикс, название будет вычисляться при рендеринге

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Функции для получения локализованных названий
  const getAreaName = (droppableId: string): string => {
    const index = Number.parseInt(droppableId.replace('droppable', ''), 10);
    return `${t('areaPrefix')} ${index}`;
  };

  const getElementName = (draggableId: string): string => {
    const index = Number.parseInt(draggableId.replace('draggable', ''), 10);
    return `${t('elementPrefix')} ${index}`;
  };

  // Загрузка конфигурации при монтировании
  useEffect(() => {
    // Защита от двойного вызова из-за React Strict Mode
    if (loadConfigRef.current) {
      return;
    }
    loadConfigRef.current = true;

    const loadConfig = async () => {
      setIsLoading(true);
      const { config, error } = await loadGameConfig('example');
      if (error) {
        // Игнорируем ошибки загрузки конфигурации
      } else if (config) {
        // Загружаем только items, имена будут вычисляться динамически
        const updatedDroppables = { ...config.droppables };
        Object.keys(updatedDroppables).forEach(droppableId => {
          updatedDroppables[droppableId] = {
            ...updatedDroppables[droppableId],
            name: '', // Имена не сохраняем, они вычисляются динамически
          };
        });
        setDroppables(updatedDroppables);
      }
      setIsLoading(false);
    };
    loadConfig();
  }, []);

  function handleDragStart({ active }: DragStartEvent) {
    const elementName = getElementName(active.id as string);
    Notifications.notify(`${t('draggedElement')} <b>${elementName}</b>`);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    const elementName = getElementName(active.id as string);
    const overDroppableKey = over?.id as string;
    const itemId = active.id as string;
    const currentDroppableKey = Object.keys(droppables).find(
      key => droppables[key].items.includes(itemId)
    );
    const isParent = currentDroppableKey == overDroppableKey;
    const areaName = overDroppableKey ? getAreaName(overDroppableKey) : '';

    if (isDroppable(overDroppableKey)) {
      if (!isParent && droppables[overDroppableKey].items.length < maxItemsPerDroppable) {
        Notifications.notify(`<b>${elementName}</b> ${t('elementOver')} <b>${areaName}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {
        Notifications.attention(`<b>${areaName}</b> ${t('noSpace')}.`);
      }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const itemId = active.id as string;
    const overDroppableKey = over?.id as string;

    // Находим, в каком droppable сейчас находится этот элемент (если есть)
    const currentDroppableKey = Object.keys(droppables).find(
      key => droppables[key].items.includes(itemId)
    );

    const elementName = getElementName(active.id as string);
    const isParent = currentDroppableKey == overDroppableKey;

    // Проверяем, является ли целевая область droppable
    if (isDroppable(overDroppableKey)) {
      const areaName = getAreaName(overDroppableKey);
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
          // Сохраняем конфигурацию после изменения с защитой от двойного вызова
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            saveGameConfig('example', updates).catch(() => {
              // Игнорируем ошибки сохранения
            });
            saveTimeoutRef.current = null;
          }, 300);
          return updates;
        });

        Notifications.success(`<b>${elementName}</b> ${t('elementMoved')} <b>${areaName}</b>`);
      } else if (!isParent && droppables[overDroppableKey].items.length >= maxItemsPerDroppable) {
        Notifications.warn(`<b>${areaName}</b> ${t('noFreeSlots')}.`);
      }
    } else if (currentDroppableKey) {
      const currentAreaName = getAreaName(currentDroppableKey);
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable
      setDroppables(prev => {
        const updates = {
          ...prev,
          [currentDroppableKey]: {
            ...prev[currentDroppableKey],
            items: prev[currentDroppableKey].items.filter(id => id !== itemId)
          },
        };
        // Сохраняем конфигурацию после изменения с защитой от двойного вызова
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveGameConfig('example', updates).catch(() => {
            // Игнорируем ошибки сохранения
          });
          saveTimeoutRef.current = null;
        }, 300);
        return updates;
      });

      Notifications.success(`${t('elementRemoved')} <b>${elementName}</b> ${t('from')} <b>${currentAreaName}</b>`);
    } else if (!currentDroppableKey) {
      // Если элемент перетащен не в droppable, удаляем его из текущего droppable
      Notifications.notify(`${t('dragCancelled')} <b>${elementName}</b>`);
    }
  }

  const droppedItems = new Set(Object.values(droppables).flatMap(droppable => droppable.items));

  if (isLoading) {
    return <div>{t('loading')}</div>;
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
                            {getElementName(itemId)}
                          </Draggable>
                        ))
                      )
                      : (
                        <p className={styles.emptyCellText}>{getAreaName(droppableId)}</p>
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
                      {getElementName(item.id)}
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