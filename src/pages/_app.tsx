// глобальные стили CSS
import "@/styles/globals.css";
// типы из Next.js для типизации props
import type { AppProps } from "next/app";

import { useMemo, useState, useEffect } from "react";

// компоненты для темы Material UI
// ThemeProvider - предоставляет тему всем дочерним компонентам
// createTheme - функция для создания кастомной темы
import { ThemeProvider, createTheme } from '@mui/material/styles';
// CssBaseline - компонент для сброса стилей браузера по умолчанию
import CssBaseline from '@mui/material/CssBaseline';

// AuthProvider - провайдер контекста авторизации
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// компоненты Material UI для разметки
import { Box, AppBar, Toolbar, Container, Typography, IconButton } from '@mui/material';
import AuthButton from '@/components/AuthButton';
import Link from "next/link";
import { useRouter } from "next/router";

// утилиты для работы с cookies
import { getCookie, setCookie } from '@/utils/cookies';

// Внутренний компонент, который использует контекст авторизации
function AppContent({ Component, pageProps }: AppProps) {
  // Получаем информацию об авторизации из контекста
  const { user, loading } = useAuth();
  const router = useRouter();

  // Инициализируем состояние темы дефолтным значением 'light'
  // Тема из куки будет применена только после авторизации
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Управление темой в зависимости от статуса авторизации
  useEffect(() => {
    // Пока идет загрузка, ничего не делаем
    if (loading) {
      return;
    }

    // Используем requestAnimationFrame для отложенного обновления, чтобы избежать предупреждений линтера
    const updateTheme = () => {
      if (user) {
        // Пользователь авторизован - читаем сохраненную тему из куки
        const cookieVal = getCookie('themeMode');
        if (cookieVal === 'light' || cookieVal === 'dark') {
          setThemeMode(cookieVal);
        }
      } else {
        // Пользователь вышел - сбрасываем тему на дефолтную светлую
        setThemeMode('light');
      }
    };
    requestAnimationFrame(updateTheme);
  }, [user, loading]);

  // useMemo, чтобы пересоздавать тему только когда меняется режим
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
      }),
    [themeMode]
  );

  // функция переключения режима темы
  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      setCookie("themeMode", next);
      return next;
    });
  };

  return (
    // ThemeProvider - оборачивает приложение темой Material UI
    // Все дочерние компоненты получат доступ к теме
    <ThemeProvider theme={theme}>
      {/* CssBaseline - нормализует стили для всех браузеров */}
      <CssBaseline />

      {/* Box - универсальный контейнер с системой стилей MUI */}
      {/* display: 'flex' - флексбокс для вертикальной компоновки */}
      {/* flexDirection: 'column' - элементы располагаются в колонку */}
      {/* minHeight: '100vh' - минимальная высота 100% высоты экрана (viewport height) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* AppBar - верхняя панель приложения (навигационная панель) */}
        <AppBar position="sticky">
          {/* Toolbar - контейнер для элементов панели */}
          <Toolbar>
            {/* Typography - компонент текста */}
            {/* variant="h6" - заголовок 6 уровня */}
            {/* component="div" - рендерится как div (не h6) */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {router.pathname === "/"
                ? (
                  <>My next.js app</>
                )
                : (
                  <Link href="/">На главную</Link>
                )}
            </Typography>

            {/* Кнопка-переключатель темы */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ mr: 1 }}
              title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
            >
              {themeMode === 'light'
                ? <span aria-label="Темная тема" style={{ fontSize: '20px' }}>🌙</span>
                : <span aria-label="Светлая тема" style={{ fontSize: '20px' }}>☀️</span>
              }
            </IconButton>
            {/* AuthButton - компонент кнопки авторизации */}
            {/* Будет показывать "Войти" или аватар пользователя */}
            <AuthButton />
          </Toolbar>
        </AppBar>

        {/* Container - контейнер для контента страниц */}
        {/* maxWidth="lg" - максимальная ширина "large" (1280px в MUI) */}
        {/* mt: 4 - margin-top: 4 единицы (32px) */}
        {/* mb: 4 - margin-bottom: 4 единицы */}
        {/* flex: 1 - элемент растягивается, заполняя оставшееся пространство */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          {/* Component - текущая страница Next.js */}
          {/* ...pageProps - spread оператор, передаёт все пропсы странице */}
          <Component {...pageProps} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

// Главный компонент приложения с провайдерами
export default function App(props: AppProps) {
  return (
    <AuthProvider>
      {/* AuthProvider - предоставляет контекст авторизации всем дочерним компонентам */}
      <AppContent {...props} />
    </AuthProvider>
  );
}
