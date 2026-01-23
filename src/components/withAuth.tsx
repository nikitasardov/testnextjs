import { ComponentType, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { useTranslations } from 'next-intl';

// Тип для компонента, который будет защищен
type ComponentProps = Record<string, unknown>;

// HOC функция принимает компонент и возвращает новый компонент
export function withAuth<P extends ComponentProps>(
  Component: ComponentType<P>
) {
  // Возвращаем новый компонент-обертку
  return function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const t = useTranslations('auth');

    // открываем модальное окно, если пользователь не авторизован
    useEffect(() => {
      // Ждем завершения проверки авторизации (loading === false)
      if (!loading && !user) {
        setAuthModalOpen(true);
      } else if (user) {
        // Если пользователь авторизовался, закрываем модальное окно
        setAuthModalOpen(false);
      }
    }, [user, loading]);

    // Пока идет проверка авторизации - показываем загрузку
    if (loading) {
      return <div>{t('checkingAuth')}</div>;
    }

    // Если не авторизован - показываем модальное окно и ничего больше
    if (!user) {
      return (
        <>
          <AuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
          {/* Можно показать заглушку, пока модальное окно открыто */}
          <div>{t('authRequired')}</div>
        </>
      );
    }

    // Если авторизован - показываем защищенный компонент
    return (
      <>
        <Component {...props} />
        <AuthModal
          open={false}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  };
}