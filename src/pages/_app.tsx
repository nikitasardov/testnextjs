// глобальные стили CSS
import "@/styles/globals.css";
// типы из Next.js для типизации props и контекста
import type { AppProps, AppContext } from "next/app";

import { useMemo, useState } from "react";

// компоненты для темы Material UI
// ThemeProvider - предоставляет тему всем дочерним компонентам
// createTheme - функция для создания кастомной темы
import { ThemeProvider, createTheme } from '@mui/material/styles';
// CssBaseline - компонент для сброса стилей браузера по умолчанию
import CssBaseline from '@mui/material/CssBaseline';

// AuthProvider - провайдер контекста авторизации
import { AuthProvider } from '@/contexts/AuthContext';

// компоненты Material UI для разметки
import { Box, AppBar, Toolbar, Container, Typography, IconButton } from '@mui/material';
import AuthButton from '@/components/AuthButton';

// утилиты для работы с cookies
import { getCookieFromHeader, setCookie } from '@/utils/cookies';

// Расширяем тип AppProps для включения initialThemeMode
interface CustomAppProps extends AppProps {
  readonly initialThemeMode: 'light' | 'dark';
}

// getInitialProps выполняется на сервере и клиенте перед первым рендером
// Это позволяет читать куки на сервере и передавать тему через pageProps
// Читая куки на сервере жертвуем 10мс рендера на клиенте, но избавляемся от мигания темы при первом рендере
App.getInitialProps = async (appContext: AppContext) => {
  const { ctx } = appContext;
  // Читаем куки из заголовков запроса (работает и на сервере, и на клиенте)
  const cookieHeader = ctx.req?.headers.cookie;
  const themeModeCookie = getCookieFromHeader(cookieHeader, 'themeMode');

  // Валидируем значение из куки или используем дефолт
  const initialThemeMode: 'light' | 'dark' =
    themeModeCookie === 'light' || themeModeCookie === 'dark'
      ? themeModeCookie
      : 'light';

  return {
    pageProps: {},
    initialThemeMode,
  };
};

export default function App({ Component, pageProps, initialThemeMode }: CustomAppProps) {
  // Инициализируем состояние темы из пропсов, полученных через getInitialProps
  // Это гарантирует одинаковый рендер на сервере и клиенте
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialThemeMode);

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

      {/* AuthProvider - предоставляет контекст авторизации всем дочерним компонентам */}
      <AuthProvider>
        {/* Box - универсальный контейнер с системой стилей MUI */}
        {/* display: 'flex' - флексбокс для вертикальной компоновки */}
        {/* flexDirection: 'column' - элементы располагаются в колонку */}
        {/* minHeight: '100vh' - минимальная высота 100% высоты экрана (viewport height) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* AppBar - верхняя панель приложения (навигационная панель) */}
          <AppBar position="static">
            {/* Toolbar - контейнер для элементов панели */}
            <Toolbar>
              {/* Typography - компонент текста */}
              {/* variant="h6" - заголовок 6 уровня */}
              {/* component="div" - рендерится как div (не h6) */}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                My next.js app
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
      </AuthProvider>
    </ThemeProvider>
  );
}
