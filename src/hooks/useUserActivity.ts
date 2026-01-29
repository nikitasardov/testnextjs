import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

/**
 * Хук для отслеживания активности пользователя
 * Отправляет heartbeat каждую минуту, только если вкладка активна
 */
export function useUserActivity() {
    const { user } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) {
            return;
        }

        let isPageVisible = !document.hidden;

        // Обработчик изменения видимости страницы
        const handleVisibilityChange = () => {
            isPageVisible = !document.hidden;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Функция для отправки heartbeat
        const sendHeartbeat = async () => {
            if (!isPageVisible || !user) {
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    return;
                }

                await fetch('/api/user-activity', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                // Игнорируем ошибки heartbeat (не критично)
                console.error('Failed to send user activity heartbeat:', error);
            }
        };

        // Отправляем heartbeat сразу при монтировании (если вкладка активна)
        if (isPageVisible) {
            sendHeartbeat();
        }

        // Устанавливаем интервал для отправки heartbeat каждую минуту
        intervalRef.current = setInterval(() => {
            if (isPageVisible) {
                sendHeartbeat();
            }
        }, 60000); // 60 секунд = 1 минута

        // Очистка при размонтировании
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user]);
}

