
import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const shimmerAnimation = keyframes`
  0% {
    background-position: 300% 0;
  }
  100% {
    background-position: -300% 0;
  }
`;
import { Draggable } from '@/components/Draggable';
import { Droppable, isDroppable } from '@/components/Droppable';
import { generateDroppables, generateDraggables, shuffleArray } from '@/utils/dnd-helpers';
import * as Notifications from '@/components/Notifications';
import { withAuth } from "@/components/withAuth";
import { saveGameConfig, loadGameConfig } from '@/utils/game-api';
import { getHintFromLLM } from '@/utils/hint-api';
import { useTranslations } from 'next-intl';
import styles from './15-puzzle.module.css';

function Dnd15Puzzle() {
  const t = useTranslations('game');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Название модели LLM для подсказки
  const [llmModelName, setLlmModelName] = useState<string>('AI');

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

  // Инициализируем droppables без локализованных названий (названия будут вычисляться при рендеринге)
  const [droppables, setDroppables] = useState<{ [key: string]: { name: string, items: string[] } }>(() => {
    return generateDroppables(16, ''); // Пустой префикс, название будет вычисляться при рендеринге
  });

  // Функция для получения локализованного названия ячейки по её ID
  const getCellName = (droppableId: string): string => {
    const index = Number.parseInt(droppableId.replace('droppable', ''), 10);
    return `${t('cell')} ${index}`;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isNewGame, setIsNewGame] = useState(false);
  const [loadedConfig, setLoadedConfig] = useState<boolean | null>(null);
  const [configToCheck, setConfigToCheck] = useState<typeof droppables | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const loadConfigRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const draggableItems = generateDraggables(15, '');

  // Функция для проверки решаемости комбинации "15-puzzle"
  // Принимает массив из 16 элементов, где 0 - пустая клетка
  const isSolvable = (board: number[]): boolean => {
    // Убедимся, что доска — массив из 16 элементов
    if (board.length !== 16) {
      throw new Error(t('boardMustBe4x4'));
    }

    // 1. Собираем последовательность без пустой клетки (0)
    const tiles = board.filter(x => x !== 0);

    // 2. Считаем инверсии (I)
    const inversions = tiles.reduce((count, tile, i) => {
      return count + tiles.slice(i + 1).filter(otherTile => tile > otherTile).length;
    }, 0);

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
          Notifications.success(t('solutionExists'));
        } else {
          Notifications.warn(t('noSolution'), 'red', true);
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
    setIsNewGame(true);
    // Проверяем решаемость после перемешивания
    checkSolvability(shuffledDroppablesState);
  };

  // Функция для сохранения конфигурации
  const handleSave = async () => {
    // Защита от двойного вызова
    if (saveTimeoutRef.current) {
      return;
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const { success, error } = await saveGameConfig('15-puzzle', droppables);
      if (success) {
        Notifications.success(t('gameSaved'));
      } else {
        Notifications.warn(`${t('saveError')}: ${error || t('unknownError')}`);
      }
      saveTimeoutRef.current = null;
    }, 100);
  };

  // Функция для получения подсказки
  const handleGetHint = async () => {
    if (isHintLoading) {
      return;
    }

    // Проверяем решаемость на фронтенде перед отправкой запроса
    try {
      const board = getBoardState(droppables);
      const filledCells = board.filter(x => x !== 0).length;

      if (filledCells === 15) {
        const solvable = isSolvable(board);
        if (!solvable) {
          // Комбинация нерешаема - показываем сообщение без запроса к API
          const unsolvableMessage = t('noSolution');
          Notifications.notify(unsolvableMessage, '#9c27b0', false, 30000);
          return;
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке решаемости:', error);
      // Продолжаем выполнение, если проверка не удалась
    }

    setIsHintLoading(true);
    // Показываем уведомление о том, что LLM думает
    Notifications.inProgress(`${llmModelName} ${t('hintInProgress')}`);

    try {
      // Передаем только состояние игры, промпт формируется на бекенде
      const { hint, error } = await getHintFromLLM(droppables);

      if (error || !hint) {
        Notifications.warn(error || t('hintError'));
        return;
      }

      Notifications.notify(hint, '#9c27b0', false, 30000);
    } catch (error) {
      console.error('Ошибка при получении подсказки:', error);
      Notifications.warn(t('hintError'));
    } finally {
      setIsHintLoading(false);
    }
  };

  // Загрузка названия модели LLM при монтировании
  useEffect(() => {
    const loadModelName = async () => {
      try {
        const response = await fetch('/api/games/get-model-name');
        if (response.ok) {
          const data = await response.json();
          if (data.modelName) {
            setLlmModelName(data.modelName);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки названия модели:', error);
      }
    };
    loadModelName();
  }, []);

  // Загрузка конфигурации при монтировании (только один раз)
  useEffect(() => {
    // Защита от двойного вызова из-за React Strict Mode и перерисовок
    if (loadConfigRef.current) {
      return;
    }
    loadConfigRef.current = true;

    const loadConfig = async () => {
      setIsLoading(true);
      const { config, error } = await loadGameConfig('15-puzzle');
      if (error) {
        console.error('Ошибка загрузки конфигурации:', error);
        // Если ошибка загрузки, начинаем новую игру
        const droppableKeys = Object.keys(droppables);
        const shuffledDroppables = shuffleArray(droppableKeys);
        const shuffledItems = shuffleArray(draggableItems.map(item => item.id));

        const shuffledDroppablesState: { [key: string]: { name: string, items: string[] } } = {};

        droppableKeys.forEach(key => {
          shuffledDroppablesState[key] = { ...droppables[key], items: [] };
        });

        shuffledItems.forEach((itemId, index) => {
          if (index < shuffledDroppables.length) {
            shuffledDroppablesState[shuffledDroppables[index]].items.push(itemId);
          }
        });

        setDroppables(shuffledDroppablesState);
        setIsNewGame(true);
        setConfigToCheck(shuffledDroppablesState);
      } else if (config) {
        // Успешно загружена конфигурация
        // Сохраняем только items из загруженной конфигурации, name будет вычисляться при рендеринге
        const loadedDroppables: typeof droppables = {};
        Object.keys(config.droppables).forEach(key => {
          loadedDroppables[key] = {
            name: '', // name не важен, будет вычисляться при рендеринге
            items: config.droppables[key].items || [],
          };
        });
        setDroppables(loadedDroppables);
        setIsNewGame(false);
        setLoadedConfig(true);
        setConfigToCheck(loadedDroppables);
      } else {
        // Конфигурация не найдена, начинаем новую игру
        const droppableKeys = Object.keys(droppables);
        const shuffledDroppables = shuffleArray(droppableKeys);
        const shuffledItems = shuffleArray(draggableItems.map(item => item.id));

        const shuffledDroppablesState: { [key: string]: { name: string, items: string[] } } = {};

        droppableKeys.forEach(key => {
          shuffledDroppablesState[key] = { ...droppables[key], items: [] };
        });

        shuffledItems.forEach((itemId, index) => {
          if (index < shuffledDroppables.length) {
            shuffledDroppablesState[shuffledDroppables[index]].items.push(itemId);
          }
        });

        setDroppables(shuffledDroppablesState);
        setIsNewGame(true);
        setConfigToCheck(shuffledDroppablesState);
      }
      setIsLoading(false);
    };
    loadConfig();
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

  // Показываем уведомление "новая игра" при первом переходе или после перемешивания
  useEffect(() => {
    if (!isLoading && isNewGame) {
      Notifications.notify(t('newGame'));
      // Сбрасываем флаг после показа уведомления
      const timer = setTimeout(() => {
        setIsNewGame(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNewGame, isLoading, t]);

  // Показываем уведомление "Игра загружена" после успешной загрузки
  useEffect(() => {
    if (!isLoading && loadedConfig === true) {
      Notifications.success(t('gameLoaded'));
      setLoadedConfig(null); // Сбрасываем флаг
    }
  }, [isLoading, loadedConfig, t]);

  // Проверяем решаемость после монтирования контейнера уведомлений
  useEffect(() => {
    if (!isLoading && configToCheck) {
      checkSolvability(configToCheck);
      setConfigToCheck(null); // Сбрасываем флаг
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, configToCheck]);

  const droppedItems = new Set(Object.values(droppables).flatMap(droppable => droppable.items));

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <>
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
                        <p className={styles.emptyCellText}>{getCellName(droppableId)}</p>
                      )
                    }
                  </div>
                </Droppable>
              ))}

            </div>
          </div>
          <div className={`${styles.buttonsContainer} ${isMobile ? styles.buttonsContainerMobile : ''}`}>
            <div className={`${styles.actionsContainer} ${isMobile ? styles.actionsContainerMobile : ''}`}>
              <Tooltip title={t('restartTooltip')}>
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
                  {t('restart')}
                </Button>
              </Tooltip>
              <Tooltip title={t('saveTooltip')}>
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
                  {t('save')}
                </Button>
              </Tooltip>
              <Tooltip title={`${llmModelName} ${t('hintTooltip')}`}>
                <Button
                  variant="contained"
                  onClick={handleGetHint}
                  disabled={isHintLoading}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{
                    mb: isMobile ? 0 : 2,
                    backgroundColor: '#9c27b0',
                    '&:hover': { backgroundColor: '#7b1fa2' },
                    flex: isMobile ? 1 : 'none',
                    ...(isHintLoading && {
                      background: 'linear-gradient(90deg, #9c27b0 0%, #ba68c8 25%, #9c27b0 50%, #ba68c8 75%, #9c27b0 100%)',
                      backgroundSize: '300% 100%',
                      animation: `${shimmerAnimation} 3s linear infinite`,
                    }),
                  }}
                >
                  {isHintLoading ? t('loading') : t('hint')}
                </Button>
              </Tooltip>
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
      <div className={styles.notificationsContainer}>
        <Notifications.Container />
      </div>
    </>
  );
}

export default withAuth(Dnd15Puzzle);