// Импортируем глобальные стили CSS
import "@/styles/globals.css";
// Импортируем тип AppProps из Next.js для типизации props
import type { AppProps } from "next/app";

// Импортируем компоненты для темы Material UI
// ThemeProvider - предоставляет тему всем дочерним компонентам
// createTheme - функция для создания кастомной темы
import { ThemeProvider, createTheme } from '@mui/material/styles';
// CssBaseline - компонент для сброса стилей браузера по умолчанию
import CssBaseline from '@mui/material/CssBaseline';

// Импортируем AuthProvider - провайдер контекста авторизации
import { AuthProvider } from '@/contexts/AuthContext';

// Импортируем компоненты Material UI для разметки
import { Box, AppBar, Toolbar, Container, Typography } from '@mui/material';

// Импортируем компонент кнопки авторизации
import AuthButton from '@/components/AuthButton';

// Создаём тему Material UI
// createTheme - настрой<｜place▁holder▁no▁67｜>ает тему для всего приложения
const theme = createTheme({
  palette: {
    mode: 'dark',  // Светлая тема (можно установить 'dark' для тёмной)
  },
});

// App - корневой компонент приложения Next.js
// Этот компонент оборачивает все страницы
// Component - текущая страница, которая будет отображена
// pageProps - пропсы, переданные на страницу
export default function App({ Component, pageProps }: AppProps) {
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
          {/* position="static" - статичное позиционирование (прокручивается вместе со страницей) */}
          <AppBar position="static">
            {/* Toolbar - контейнер для элементов панели */}
            <Toolbar>
              {/* Typography - компонент текста */}
              {/* variant="h6" - заголовок 6 уровня */}
              {/* component="div" - рендерится как div (не h6) */}
              {/* flexGrow: 1 - элемент занимает всё доступное пространство */}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                My next.js app
              </Typography>

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
