// Импортируем хук useState для управления состоянием
import { useState } from 'react';
// Импортируем компоненты Material UI
import { Button, Box, Avatar, Menu, MenuItem, Typography, Divider } from '@mui/material';
// Импортируем кастомный хук useAuth для получения данных авторизации
import { useAuth } from '@/contexts/AuthContext';
// Импортируем компонент модального окна авторизации
import AuthModal from './AuthModal';

// Функциональный компонент кнопки авторизации
export default function AuthButton() {
    // Используем хук useAuth для получения данных о пользователе
    // Деструктуризация объекта: извлекаем user и signOut
    const { user, signOut } = useAuth();

    // Состояние для управления видимостью модального окна
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // Состояние для элемента-якоря выпадающего меню
    // HTMLElement | null - может быть HTML-элемент или null
    // Это нужно для позиционирования выпадающего меню относительно кнопки
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Обработчик клика по профилю (для открытия меню)
    // React.MouseEvent<HTMLElement> - тип события клика мыши
    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
        // event.currentTarget - элемент, на который мы кликнули
        // Устанавливаем якорь для меню
        setAnchorEl(event.currentTarget);
    };

    // Обработчик закрытия меню
    const handleProfileClose = () => {
        // Убираем якорь, меню закрывается
        setAnchorEl(null);
    };

    // Обработчик выхода из системы
    const handleSignOut = async () => {
        // async - асинхронная функция
        // await - ждём завершения выхода
        await signOut();
        // Закрываем меню после выхода
        handleProfileClose();
    };

    // Условный рендеринг: если пользователь не авторизован
    if (!user) {
        // Рендерим кнопку "Войти" и модальное окно
        return (
            <>
                {/* Fragment (<></>) - обёртка без дополнительного DOM-элемента
                    В старом React был React.Fragment, теперь можно <> */}
                <Button variant="contained" onClick={() => setAuthModalOpen(true)}>
                    {/* variant="contained" - заполненная кнопка
                        onClick - вызывается стрелочная функция, которая открывает модальное окно */}
                    Войти
                </Button>
                {/* AuthModal - модальное окно авторизации
                    open - контролируется состоянием authModalOpen
                    onClose - при закрытии устанавливаем false */}
                <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </>
        );
    }

    // Если пользователь авторизован, показываем аватар и меню
    return (
        <>
            {/* Box - контейнер с Mab стилей */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* sx - styled system (стили как объект)
                    display: 'flex' - флексбокс
                    alignItems: 'center' - выравнивание по центру
                    gap: 1 - расстояние между элементами */}

                {/* Кнопка с аватаром */}
                <Button
                    onClick={handleProfileClick}  // При клике открываем меню
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textTransform: 'none',    // Убираем верхний регистр (по умолчанию кнопки делают uppercase)
                    }}
                >
                    {/* Avatar - аватар пользователя
                        sx - размеры 32x32 пикселя */}
                    <Avatar sx={{ width: 32, height: 32 }}>
                        {/* user.email?.charAt(0) - опциональный доступ к первой букве email
                            .toUpperCase() - преобразуем в верхний регистр
                            || 'U' - если email нет, показываем 'U' (User) */}
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>

                    {/* Typography - компонент текста
                        variant="body2" - вариант текста (средний размер) */}
                    <Typography variant="body2">{user.email}</Typography>
                </Button>
            </Box>

            {/* Menu - выпадающее меню Material UI */}
            <Menu
                anchorEl={anchorEl}           // Якорь для позиционирования
                open={Boolean(anchorEl)}      // Boolean() - преобразует в boolean (null -> false)
                onClose={handleProfileClose}  // При закрытии вызываем обработчик
                anchorOrigin={{               // Точка привязки якоря
                    vertical: 'bottom',       // Снизу от кнопки
                    horizontal: 'right',      // Справа
                }}
                transformOrigin={{            // Точка трансформации меню
                    vertical: 'top',          // Верхняя часть меню
                    horizontal: 'right',      // Справа
                }}
            >
                {/* MenuItem - элемент меню
                    disabled - элемент неактивен (нельзя кликнуть)
                    Это просто информационный элемент */}
                <MenuItem disabled>
                    <Typography variant="body2">ID: {user.id}</Typography>
                </MenuItem>

                {/* Divider - разделитель между элементами меню */}
                <Divider />

                {/* Кнопка выхода */}
                <MenuItem onClick={handleSignOut}>
                    <Typography>Выйти</Typography>
                </MenuItem>
            </Menu>
        </>
    );
}
