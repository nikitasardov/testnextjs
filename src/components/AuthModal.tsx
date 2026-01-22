// хук useState для управления состоянием компонента
import { useState } from 'react';
// компоненты Material UI для создания модального окна
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
// клиент Supabase
import { supabase } from '@/utils/supabase';
// локализация
import { useTranslations } from 'next-intl';

// Интерфейс описывает структуру props (свойств) компонента
// readonly - props не могут быть изменены внутри компонента (только для чтения)
interface AuthModalProps {
    readonly open: boolean;   // Флаг видимости модального окна
    readonly onClose: () => void;  // Функция закрытия модального окна (не возвращает значение)
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
    const t = useTranslations('auth');
    // Создаём состояния компонента с помощью хука useState
    const [tab, setTab] = useState(0);           // Активная вкладка (0 - вход, 1 - регистрация)
    const [email, setEmail] = useState('');      // Email пользователя
    const [password, setPassword] = useState(''); // Пароль пользователя
    const [loading, setLoading] = useState(false); // Флаг загрузки во время запроса
    const [errorMsg, setErrorMsg] = useState('');       // Текст ошибки для отображения
    const [successMsg, setSuccessMsg] = useState('');   // Текст успешного сообщения
    const [isResetMode, setIsResetMode] = useState(false); // Режим восстановления пароля

    // Обработчик переключения вкладок
    // React.SyntheticEvent - тип события React (обёртка над нативным событием браузера)
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);      // Устанавливаем новую активную вкладку
        setErrorMsg('');          // Очищаем ошибки
        setSuccessMsg('');        // Очищаем сообщения успеха
        setEmail('');          // Очищаем поля ввода
        setPassword('');
        setIsResetMode(false); // Сбрасываем режим восстановления пароля
    };

    // Функция регистрации нового пользователя
    // async - асинхронная функция (работает с промисами)
    const handleSignUp = async () => {
        // Валидация: проверяем, что поля заполнены
        if (!email || !password) {
            setErrorMsg(t('fillAllFields'));
            return;  // Выходим из функции, если не заполнено
        }

        // Начинаем процесс загрузки
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

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
                setSuccessMsg(t('registrationSuccess'));
            }
        } catch (err) {
            // Обработка ошибки
            // err instanceof Error - проверка, является ли err объектом Error
            setErrorMsg(err instanceof Error ? err.message : t('registrationError'));
        } finally {
            // Независимо от результата, отключаем загрузку
            setLoading(false);
        }
    };

    // Функция входа в систему (аналогична регистрации)
    const handleSignIn = async () => {
        if (!email || !password) {
            setErrorMsg(t('fillAllFields'));
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            // Используем signInWithPassword вместо signUp
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                setSuccessMsg(t('loginSuccess'));
                // setTimeout - устанавливаем задержку перед выполнением функции
                // Используем для того, чтобы пользователь увидел сообщение об успехе
                setTimeout(() => {
                    onClose();        // Закрываем модальное окно
                    setEmail('');     // Очищаем поля
                    setPassword('');
                    setSuccessMsg('');
                }, 1000);  // 1000 миллисекунд = 1 секунда
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : t('loginError'));
        } finally {
            setLoading(false);
        }
    };

    // Функция восстановления пароля
    const handleResetPassword = async () => {
        if (!email) {
            setErrorMsg(t('enterEmail'));
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Отправляем письмо для восстановления пароля
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${globalThis.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccessMsg(t('resetPasswordEmailSent'));
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : t('resetPasswordError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* Dialog - модальное окно Material UI
                open - контролирует видимость
                onClose - вызывается при попытке закрыть окно
                maxWidth="sm" - максимальная ширина маленькая
                fullWidth - занимает всю доступную ширину */}

            <DialogTitle>
                {isResetMode
                    ? (
                        <Typography variant="h6">{t('resetPassword')}</Typography>
                    )
                    : (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            {/* sx - пропс для стилизации (styled system от MUI)
                            borderBottom: 1 - нижняя граница толщиной 1px
                            borderColor: 'divider' - цвет границы как у разделителя */}
                            <Tabs value={tab} onChange={handleTabChange}>
                                {/* value - активная вкладка
                                onChange - вызывается при переключении */}
                                <Tab label={t('login')} />
                                <Tab label={t('signUp')} />
                            </Tabs>
                        </Box>
                    )}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ pt: 3 }}>
                    {/* pt: 3 - padding-top: 3 единицы (в MUI 1 единица = 8px) */}

                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {/* severity - тип алерта (error, warning, info, success)
                                mb: 2 - margin-bottom */}
                            {errorMsg}
                        </Alert>
                    )}

                    {successMsg && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMsg}
                        </Alert>
                    )}

                    {/* Поле ввода email */}
                    <TextField
                        autoFocus                    // Автоматический фокус при открытии
                        margin="dense"                      // Небольшие отступы
                        label={t('email')}               // Подсказка в поле
                        type="email"                // Тип поля (для валидации браузера)
                        fullWidth                   // Занимает всю ширину
                        variant="outlined"          // Вариант поля (с границей)
                        value={email}               // Контролируемое значение (controlled component)
                        onChange={(e) => setEmail(e.target.value)}  // Обработчик изменения
                        disabled={loading}          // Отключаем во время загрузки
                        sx={{ mb: 2 }}             // Стили: margin-bottom
                    />

                    {/* Поле ввода пароля - показываем только если не режим восстановления */}
                    {!isResetMode && (
                        <TextField
                            margin="dense"
                            label={t('password')}
                            type="password"             // Текст скрывается звёздочками
                            fullWidth
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            sx={{ mb: 2 }}
                        />
                    )}

                    {/* Кнопка "Забыли пароль?" на вкладке входа */}
                    {tab === 0 && !isResetMode && (
                        <Box sx={{ mb: 2, textAlign: 'right' }}>
                            <Button
                                size="small"
                                onClick={() => {
                                    setIsResetMode(true);
                                    setErrorMsg('');
                                    setSuccessMsg('');
                                    setPassword('');
                                }}
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                {t('forgotPassword')}
                            </Button>
                        </Box>
                    )}

                    {/* Условное отображение подсказки в зависимости от вкладки */}
                    {/* Если активна вкладка 0 (вход) */}
                    {tab === 0 && !isResetMode && (
                        <Typography variant="caption" color="text.secondary">
                            {/* variant - вариант текста (caption - самый мелкий)
                                color - цвет текста */}
                            {t('enterAccount')}
                        </Typography>
                    )}

                    {tab === 1 && (
                        <Typography variant="caption" color="text.secondary">
                            {t('createAccount')}
                        </Typography>
                    )}

                    {isResetMode && (
                        <Typography variant="caption" color="text.secondary">
                            {t('resetHint')}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            {/* Блок с кнопками действий */}
            <DialogActions sx={{ px: 3, pb: 3 }}>
                {/* px: 3 - padding горизонтальный
                    pb: 3 - padding bottom */}

                {/* Кнопка отмены или назад */}
                {isResetMode ? (
                    <Button
                        onClick={() => {
                            setIsResetMode(false);
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}
                        disabled={loading}
                    >
                        {t('back')}
                    </Button>
                ) : (
                    <Button onClick={onClose} disabled={loading}>
                        {t('cancel')}
                    </Button>
                )}

                {/* Основная кнопка (вход, регистрация или восстановление пароля) */}
                <Button
                    variant="contained"  // Вариант кнопки (заполненная)
                    disabled={loading}   // Отключаем во время загрузки
                    // startIcon - иконка в начале кнопки
                    // Условный рендеринг: показываем индикатор загрузки
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    onClick={() => {
                        if (isResetMode) {
                            handleResetPassword();
                        } else if (tab === 0) {
                            handleSignIn();
                        } else {
                            handleSignUp();
                        }
                    }}
                >
                    {/* IIFE (Immediately Invoked Function Expression) - функция, вызываемая сразу
                        Используется для условного возврата текста */}
                    {(() => {
                        if (loading) return t('loading');
                        // Если режим восстановления - показываем "Отправить"
                        if (isResetMode) return t('send');
                        // Тернарный оператор для выбора текста кнопки
                        return tab === 0 ? t('login') : t('signUp');
                    })()}
                    {/* Двойные скобки ()() - вызов функции сразу */}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
