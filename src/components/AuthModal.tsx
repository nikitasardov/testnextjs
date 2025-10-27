// Импортируем хук useState для управления состоянием компонента
import { useState } from 'react';
// Импортируем компоненты Material UI для создания модального окна
import {
    Dialog,        // Модальное окно (диалоговое окно)
    DialogTitle,   // Заголовок модального окна
    DialogContent, // Содержимое модального окна
    DialogActions, // Действия в модальном окне (кнопки)
    TextField,     // Поле ввода текста
    Button,        // Кнопка
    Tab,           // Вкладка
    Tabs,          // Контейнер для вкладок
    Box,           // Универсальный контейнер с настройками стилей
    Typography,    // Текстовый компонент
    Alert,         // Компонент для уведомлений
    CircularProgress // Индикатор загрузки (кружок)
} from '@mui/material';
// Импортируем настроенный клиент Supabase
import { supabase } from '@/utils/supabase';

// Интерфейс описывает структуру props (свойств) компонента
// readonly - props не могут быть изменены внутри компонента (только для чтения)
interface AuthModalProps {
    readonly open: boolean;   // Флаг видимости модального окна
    readonly onClose: () => void;  // Функция закрытия модального окна (не возвращает значение)
}

// Функциональный компонент (в React 15 были только классовые компоненты)
// В новых версиях React функциональные компоненты - основной способ
export default function AuthModal({ open, onClose }: AuthModalProps) {
    // Создаём состояния компонента с помощью хука useState
    const [tab, setTab] = useState(0);           // Активная вкладка (0 - вход, 1 - регистрация)
    const [email, setEmail] = useState('');      // Email пользователя
    const [password, setPassword] = useState(''); // Пароль пользователя
    const [loading, setLoading] = useState(false); // Флаг загрузки во время запроса
    const [error, setError] = useState('');       // Текст ошибки для отображения
    const [success, setSuccess] = useState('');   // Текст успешного сообщения

    // Обработчик переключения вкладок
    // React.SyntheticEvent - тип события React (обёртка над нативным событием браузера)
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);      // Устанавливаем новую активную вкладку
        setError('');          // Очищаем ошибки
        setSuccess('');        // Очищаем сообщения успеха
        setEmail('');          // Очищаем поля ввода
        setPassword('');
    };

    // Функция регистрации нового пользователя
    // async - асинхронная функция (работает с промисами)
    const handleSignUp = async () => {
        // Валидация: проверяем, что поля заполнены
        if (!email || !password) {
            setError('Заполните все поля');
            return;  // Выходим из функции, если не заполнено
        }

        // Начинаем процесс загрузки
        setLoading(true);
        setError('');
        setSuccess('');

        // try-catch-finally - обработка ошибок
        // try - код, который может выбросить ошибку
        // catch - обработка ошибки
        // finally - код, который выполнится в любом случае
        try {
            // Вызываем метод регистрации Supabase
            // await - ждём завершения асинхронной операции
            const { data, error } = await supabase.auth.signUp({
                email,     // Короткая запись email: email
                password,  // Короткая запись password: password
            });

            // Если есть ошибка, выбрасываем её
            if (error) throw error;

            // Если регистрация успешна и есть данные пользователя
            if (data.user) {
                setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
            }
        } catch (err) {
            // Обработка ошибки
            // err instanceof Error - проверка, является ли err объектом Error
            setError(err instanceof Error ? err.message : 'Ошибка при регистрации');
        } finally {
            // Независимо от результата, отключаем загрузку
            setLoading(false);
        }
    };

    // Функция входа в систему (аналогична регистрации)
    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Заполните все поля');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Используем signInWithPassword вместо signUp
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                setSuccess('Вход выполнен успешно!');
                // setTimeout - устанавливаем задержку перед выполнением функции
                // Используем для того, чтобы пользователь увидел сообщение об успехе
                setTimeout(() => {
                    onClose();        // Закрываем модальное окно
                    setEmail('');     // Очищаем поля
                    setPassword('');
                    setSuccess('');
                }, 1000);  // 1000 миллисекунд = 1 секунда
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при входе');
        } finally {
            setLoading(false);
        }
    };

    // Возвращаем JSX (синтаксис, похожий на HTML, но это JavaScript)
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* Dialog - модальное окно Material UI
                open - контролирует видимость
                onClose - вызывается при попытке закрыть окно
                maxWidth="sm" - максимальная ширина маленькая
                fullWidth - занимает всю доступную ширину */}

            <DialogTitle>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {/* sx - пропс для стилизации (styled system от MUI)
                        borderBottom: 1 - нижняя граница толщиной 1px
                        borderColor: 'divider' - цвет границы как у разделителя */}
                    <Tabs value={tab} onChange={handleTabChange}>
                        {/* value - активная вкладка
                            onChange - вызывается при переключении */}
                        <Tab label="Вход" />
                        <Tab label="Регистрация" />
                    </Tabs>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ pt: 3 }}>
                    {/* pt: 3 - padding-top: 3 единицы (в MUI 1 единица = 8px) */}

                    {/* Условный рендеринг: {условие && JSX}
                        Если error не пустая строка, отобразится Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {/* severity - тип алерта (error, warning, info, success)
                                mb: 2 - margin-bottom */}
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    {/* Поле ввода email */}
                    <TextField
                        autoFocus                    // Автоматический фокус при открытии
                        margin="dense"                      // Небольшие отступы
                        label="Email"               // Подсказка в поле
                        type="email"                // Тип поля (для валидации браузера)
                        fullWidth                   // Занимает всю ширину
                        variant="outlined"          // Вариант поля (с границей)
                        value={email}               // Контролируемое значение (controlled component)
                        onChange={(e) => setEmail(e.target.value)}  // Обработчик изменения
                        disabled={loading}          // Отключаем во время загрузки
                        sx={{ mb: 2 }}             // Стили: margin-bottom
                    />

                    {/* Поле ввода пароля */}
                    <TextField
                        margin="dense"
                        label="Пароль"
                        type="password"             // Текст скрывается звёздочками
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />

                    {/* Условное отображение подсказки в зависимости от вкладки */}
                    {/* Если активна вкладка 0 (вход) */}
                    {tab === 0 && (
                        <Typography variant="caption" color="text.secondary">
                            {/* variant - вариант текста (caption - самый мелкий)
                                color - цвет текста */}
                            Войдите в свой аккаунт
                        </Typography>
                    )}

                    {tab === 1 && (
                        <Typography variant="caption" color="text.secondary">
                            Создайте новый аккаунт
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            {/* Блок с кнопками действий */}
            <DialogActions sx={{ px: 3, pb: 3 }}>
                {/* px: 3 - padding горизонтальный
                    pb: 3 - padding bottom */}

                {/* Кнопка отмены */}
                <Button onClick={onClose} disabled={loading}>
                    Отмена
                </Button>

                {/* Основная кнопка (вход или регистрация) */}
                <Button
                    // Тернарный оператор: условие ? значение1 : значение2
                    // Если tab === 0, вызываем handleSignIn, иначе handleSignUp
                    onClick={tab === 0 ? handleSignIn : handleSignUp}
                    variant="contained"  // Вариант кнопки (заполненная)
                    disabled={loading}   // Отключаем во время загрузки
                    // startIcon - иконка в начале кнопки
                    // Условный рендеринг: показываем индикатор загрузки
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {/* IIFE (Immediately Invoked Function Expression) - функция, вызываемая сразу
                        Используется для условного возврата текста */}
                    {(() => {
                        if (loading) return 'Загрузка...';
                        // Тернарный оператор для выбора текста кнопки
                        return tab === 0 ? 'Войти' : 'Зарегистрироваться';
                    })()}
                    {/* Двойные скобки ()() - вызов функции сразу */}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
