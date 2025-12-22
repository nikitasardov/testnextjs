
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button, useMediaQuery, useTheme } from '@mui/material';
import { Draggable } from '../../components/Draggable';
import { Droppable, isDroppable } from '../../components/Droppable';
import { generateDroppables, generateDraggables, shuffleArray } from '../../utils/dnd-helpers';
import * as Msg from '../../components/Notifications';
import { withAuth } from "@/components/withAuth";
import styles from './15-puzzle.module.css';

function DndGame15() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Настройка сенсоров для поддержки touch-событий на мобильных устройствах
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 8,
      },
    })
  );

  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(
    generateDroppables(16, 'Ячейка ')
  );

  const draggableItems = generateDraggables(15, '');

  // Функция для проверки решаемости комбинации "15-puzzle"
  // Принимает массив из 16 элементов, где 0 - пустая клетка
  const isSolvable = (board: number[]): boolean => {
    // Убедимся, что доска — массив из 16 элементов
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
    const emptyRowFromTop = Math.floor(emptyIndex / 4);      // 0..3 сверху
    const emptyRowFromBottom = 4 - emptyRowFromTop;         // 1..4 снизу

    // 4. Для доски 4×4: решаема ⇔ (inversions + emptyRowFromBottom) — нечётно
    return (inversions + emptyRowFromBottom) % 2 === 1;
  };

  // Функция для преобразования состояния droppables в массив board для проверки решаемости
  const getBoardState = (droppablesToCheck: typeof droppables = droppables): number[] => {
    const board: number[] = [];
    const droppableKeys = Object.keys(droppablesToCheck).sort((a, b) => {
      // Сортируем по номеру: droppable1, droppable2, ..., droppable16
      const numA = Number.parseInt(a.replace('droppable', ''), 10);
      const numB = Number.parseInt(b.replace('droppable', ''), 10);
      return numA - numB;
    });

    droppableKeys.forEach(droppableId => {
      const droppable = droppablesToCheck[droppableId];
      if (droppable.items.length > 0) {
        // Извлекаем номер из id элемента (draggable1 -> 1, draggable2 -> 2, и т.д.)
        const itemId = droppable.items[0];
        const num = Number.parseInt(itemId.replace('draggable', ''), 10);
        board.push(num);
      } else {
        // Пустая ячейка
        board.push(0);
      }
    });

    return board;
  };

  // Функция для проверки решаемости комбинации
  const checkSolvability = (droppablesToCheck: typeof droppables) => {
    try {
      // Удаляем предыдущие постоянные уведомления
      const notifications = document.getElementById('notifications');
      if (notifications) {
        const existingPersistent = notifications.querySelectorAll('.persistent-notification');
        existingPersistent.forEach(el => el.remove());
      }

      const board = getBoardState(droppablesToCheck);
      // Проверяем, что все элементы на доске (15 элементов + 1 пустая)
      const filledCells = board.filter(x => x !== 0).length;
      if (filledCells === 15) {
        const solvable = isSolvable(board);
        if (solvable) {
          Msg.success('Решение есть!');
        } else {
          Msg.warn('Комбинация не решаема', 'red', true);
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке решаемости:', error);
    }
  };

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
    // Проверяем решаемость после перемешивания
    checkSolvability(shuffledDroppablesState);
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
    <>
      <Msg.Notifications single={true} />
      <div className={`${styles.container} ${isMobile ? styles.containerMobile : ''}`}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className={`${styles.gameContainer} ${isMobile ? styles.gameContainerMobile : ''}`}>
            <div className={`${styles.gameBoard} ${isMobile ? styles.gameBoardMobile : ''}`}>

              {Object.keys(droppables).map(droppableId => (
                <Droppable key={droppableId} id={droppableId} noOpacity={true}>
                  <div className={`${styles.cell} ${isMobile ? styles.cellMobile : ''}`}>
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
          </div>
          <div className={`${styles.buttonsContainer} ${isMobile ? styles.buttonsContainerMobile : ''}`}>
            <div className={`${styles.actionsContainer} ${isMobile ? styles.actionsContainerMobile : ''}`}>
              <Button
                variant="contained"
                onClick={shuffleItems}
                sx={{
                  mb: isMobile ? 0 : 2,
                  backgroundColor: 'red',
                  '&:hover': { backgroundColor: '#d32f2f' },
                  flex: isMobile ? 1 : 'none'
                }}
              >
                Перемешать
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  mb: isMobile ? 0 : 2,
                  backgroundColor: 'green',
                  '&:hover': { backgroundColor: '#2e7d32' },
                  flex: isMobile ? 1 : 'none'
                }}
              >
                Сохранить
              </Button>
            </div>
            {!isMobile && draggableItems.map(item => {
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
    </>
  );
}

export default withAuth(DndGame15);