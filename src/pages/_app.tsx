// глобальные стили CSS
import "@/styles/globals.css";

import type { AppContext, AppProps } from "next/app";
import NextApp from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";

import { useMemo, useState, useEffect } from "react";

import { IntlProvider, useTranslations } from "next-intl";

// компоненты для темы Material UI
// ThemeProvider - предоставляет тему всем дочерним компонентам
// createTheme - функция для создания кастомной темы
import { ThemeProvider, createTheme } from '@mui/material/styles';
// CssBaseline - компонент для сброса стилей браузера по умолчанию
import CssBaseline from '@mui/material/CssBaseline';

// AuthProvider - провайдер контекста авторизации
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// компоненты Material UI
import { Box, AppBar, Toolbar, Container, Typography, IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AuthButton from '@/components/AuthButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// утилиты для работы с cookies
import { getCookie, setCookie, getCookieFromHeader } from '@/utils/cookies';

import { getAllMessages } from "@/locales/loadMessages";
import { defaultLocale, locales, type AppLocale } from "@/locales/config";
import type { Messages } from "@/locales/messages";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";

// Внутренний компонент, который использует контекст авторизации
function AppContent({ Component, pageProps }: AppProps<{ messages: Messages; locale: string }>) {
  // Получаем информацию об авторизации из контекста
  const { user, loading } = useAuth();
  const router = useRouter();
  // Получаем переводы из контекста локали для динамического обновления
  const t = useTranslations('common');

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
                  <>{t('brand')}</>
                )
                : (
                  <Link href="/">{t('backHome')}</Link>
                )}
            </Typography>

            {/* Кнопка-переключатель темы */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ mr: 1 }}
              title={themeMode === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
              aria-label={themeMode === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
            >
              {themeMode === 'light'
                ? <DarkModeIcon aria-label={t('switchToDarkMode')} />
                : <LightModeIcon aria-label={t('switchToLightMode')} />
              }
            </IconButton>
            {/* Переключатель языка */}
            <LanguageSwitcher />
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
    <LocaleProvider
      initialLocale={props.pageProps.locale as AppLocale}
      initialMessages={props.pageProps.messages}
    >
      <IntlProviderWrapper>
        <AuthProvider>
          {/* AuthProvider - предоставляет контекст авторизации всем дочерним компонентам */}
          <AppContent {...props} />
        </AuthProvider>
      </IntlProviderWrapper>
    </LocaleProvider>
  );
}

// Обёртка для IntlProvider, которая использует контекст локали
function IntlProviderWrapper({ children }: { readonly children: React.ReactNode }) {
  const { locale, messages } = useLocale();

  // Используем useMemo для стабилизации объекта messages, чтобы избежать лишних перерисовок
  const stableMessages = useMemo(() => messages, [messages]);

  return (
    <IntlProvider
      locale={locale}
      messages={stableMessages}
      timeZone="UTC"
    >
      {children}
    </IntlProvider>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);

  // Определяем локаль по той же логике, что и middleware
  let locale: AppLocale = defaultLocale;

  // Проверяем cookie
  const cookieHeader = appContext.ctx.req?.headers.cookie;
  const cookieLocale = getCookieFromHeader(cookieHeader, 'locale');
  if (cookieLocale && locales.includes(cookieLocale as AppLocale)) {
    locale = cookieLocale as AppLocale;
  } else {
    // Проверяем Accept-Language
    const acceptLanguage = appContext.ctx.req?.headers['accept-language'];
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',').map((part) => part.trim().split(';')[0]);
      const match = preferred.find((lang) => locales.includes(lang as AppLocale));
      if (match) locale = match as AppLocale;
    }
  }

  const messages = getAllMessages(locale);

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      locale,
      messages,
    },
  };
};
