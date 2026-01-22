// хук useState для управления состоянием компонента
import { useState, useEffect } from 'react';
// useRouter для навигации в Next.js
import { useRouter } from 'next/router';
// компоненты Material UI
import {
    Box,           // Универсальный контейнер с настройками стилей
    TextField,     // Поле ввода текста
    Button,        // Кнопка
    Typography,    // Текстовый компонент
    Alert,         // Компонент для уведомлений
    CircularProgress, // Индикатор загрузки
    Paper,         // Контейнер с тенью
    Container      // Контейнер с ограниченной шириной
} from '@mui/material';
// клиент Supabase
import { supabase } from '@/utils/supabase';
// локализация
import { useTranslations } from 'next-intl';

export default function ResetPassword() {
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const router = useRouter();
    // Состояния компонента
    const [password, setPassword] = useState(''); // Новый пароль
    const [confirmPassword, setConfirmPassword] = useState(''); // Подтверждение пароля
    const [loading, setLoading] = useState(true); // Флаг загрузки (изначально true для проверки токена)
    const [errorMsg, setErrorMsg] = useState(''); // Текст ошибки
    const [successMsg, setSuccessMsg] = useState(''); // Текст успешного сообщения
    const [isValidToken, setIsValidToken] = useState(false); // Валидность токена

    // useEffect выполняется при монтировании компонента
    // Обрабатываем токены из URL hash-фрагмента
    useEffect(() => {
        // Функция для обработки токенов восстановления пароля
        const handleResetPassword = async () => {
            try {
                // Получаем hash-фрагмент из URL (например: #access_token=...&type=recovery&...)
                const hashParams = new URLSearchParams(globalThis.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                // Проверяем, что это токен восстановления пароля
                if (type !== 'recovery' || !accessToken || !refreshToken) {
                    setErrorMsg(t('invalidLink'));
                    setLoading(false);
                    return;
                }

                // Устанавливаем сессию с токенами из письма
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    throw sessionError;
                }

                // Если сессия установлена успешно, токен валиден
                setIsValidToken(true);
            } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : t('linkError'));
            } finally {
                setLoading(false);
            }
        };

        // Вызываем функцию обработки
        handleResetPassword();
    }, [t]); // Включаем t в зависимости, так как используется в обработке ошибок

    // Функция обновления пароля
    const handleUpdatePassword = async () => {
        // Валидация полей
        if (!password || !confirmPassword) {
            setErrorMsg(t('fillAllFields'));
            return;
        }

        // Проверка совпадения паролей
        if (password !== confirmPassword) {
            setErrorMsg(t('passwordsNotMatch'));
            return;
        }

        // Проверка минимальной длины пароля
        if (password.length < 6) {
            setErrorMsg(t('passwordMinLength'));
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Обновляем пароль пользователя
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            // Пароль успешно обновлен
            setSuccessMsg(t('passwordChanged'));

            // Перенаправляем на главную страницу через 2 секунды
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : t('changePasswordError'));
        } finally {
            setLoading(false);
        }
    };

    // Показываем индикатор загрузки во время проверки токена
    if (loading && !isValidToken) {
        return (
            <Container maxWidth="sm">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>{t('checkingLink')}</Typography>
                </Box>
            </Container>
        );
    }

    // Если токен невалиден, показываем ошибку
    if (!isValidToken) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{ p: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMsg || t('invalidLink')}
                        </Alert>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => router.push('/')}
                        >
                            {tCommon('backToHome')}
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }

    // Форма для ввода нового пароля
    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        {t('resetPasswordTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('resetPasswordDescription')}
                    </Typography>

                    {/* Сообщение об ошибке */}
                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMsg}
                        </Alert>
                    )}

                    {/* Сообщение об успехе */}
                    {successMsg && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMsg}
                        </Alert>
                    )}

                    {/* Поле ввода нового пароля */}
                    <TextField
                        margin="dense"
                        label={t('newPassword')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                        autoFocus
                    />

                    {/* Поле подтверждения пароля */}
                    <TextField
                        margin="dense"
                        label={t('confirmPassword')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 3 }}
                    />

                    {/* Кнопка обновления пароля */}
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleUpdatePassword}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? t('changingPassword') : t('changePassword')}
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
}

