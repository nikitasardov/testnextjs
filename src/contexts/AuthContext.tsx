// Импортируем необходимые хуки и типы из React
// useState - хук для работы с состоянием компонента (аналог this.setState в старом React)
// useEffect - хук для выполнения побочных эффектов (загрузка данных, подписки и т.д.)
// useMemo - хук для мемоизации (кэширования) значений для оптимизации производительности
// createContext - создание контекста для передачи данных между компонентами без пропсов
// useContext - хук для получения данных из контекста
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
// Импортируем тип User из библиотеки Supabase для типизации данных пользователя
import { User } from '@supabase/supabase-js';
// Импортируем настроенный клиент Supabase для работы с базой данных и авторизацией
import { supabase } from '@/utils/supabase';

// Интерфейс - это как контракт в TypeScript, описывает структуру объекта
// Это помогает избежать ошибок типов на этапе разработки
// AuthContextType - описывает, какие данные и функции будут доступны через контекст
interface AuthContextType {
    user: User | null;  // Информация о пользователе (или null если не авторизован)
    loading: boolean;   // Флаг загрузки (true во время получения данных о пользователе)
    signOut: () => Promise<void>;  // Функция выхода из системы (возвращает Promise - асинхронная операция)
}

// Создаём контекст. createContext принимает значение по умолчанию
// Это значение используется, если компонент использует контекст вне Provider
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },  // Пустая функция по умолчанию (async - асинхронная функция)
});

// Создаём кастомный хук useAuth для упрощения использования контекста
// Вместо useContext(AuthContext) везде, можно просто useAuth()
// Это как алиас (псевдоним) для более удобного использования
export const useAuth = () => useContext(AuthContext);

// AuthProvider - компонент-обертка, который предоставляет данные авторизации всем дочерним компонентам
// ReactNode - это тип, который может быть любым элементом React (компонент, строка, число и т.д.)
// readonly - ключевое слово TypeScript, означающее что props нельзя изменить внутри компонента
export function AuthProvider({ children }: { readonly children: ReactNode }) {
    // useState - хук для управления состоянием (новый способ в React вместо this.state)
    // [user, setUser] - деструктуризация массива:
    //   user - текущее значение состояния
    //   setUser - функция для изменения этого значения
    // useState<User | null>(null) - указываем тип TypeScript (User или null) и начальное значение (null)
    const [user, setUser] = useState<User | null>(null);
    // loading - состояние загрузки, изначально true (пока проверяем авторизацию)
    const [loading, setLoading] = useState(true);

    // useEffect - хук для побочных эффектов (аналог CircularProgress componentDidMount + componentDidUpdate в старом React)
    // Первый параметр - функция, которая выполнится
    // Второй параметр [](пустой массив зависимостей) - означает, что эффект выполнится только один раз при монтировании
    useEffect(() => {
        // Получаем текущую сессию пользователя из Supabase
        // .then() - обработка Promise (асинхронной операции)
        // { data: { session } } - деструктуризация ответа от Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            // session?.user - безопасный доступ к user (оператор опциональной цепочки)
            // Если session === null, то user будет undefined, а не ошибка
            // ?? null - оператор nullish coalescing: если session?.user === undefined, то вернётся null
            // Это нужно, потому что user имеет тип User | null
            setUser(session?.user ?? null);
            setLoading(false);  // Загрузка завершена, меняем флаг
        });

        // Подписываемся на изменения авторизации
        // Каждый раз, когда пользователь входит/выходит, выполнится эта функция
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            // _event - подчёркивание означает, что параметр не используется (это принятое соглашение)
            // Обновляем состояние при изменении авторизации
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Функция очистки - выполнится при размонтировании компонента
        // Важно отписаться от событий, чтобы избежать утечек памяти
        return () => subscription.unsubscribe();
    }, []);  // Пустой массив зависимостей - эффект выполняется только при монтировании

    // Функция выхода из системы
    // async - означает, что функция асинхронная (работает с промисами)
    // await - ждём завершения асинхронной операции перед возвратом
    const signOut = async () => {
        await supabase.auth.signOut();
    };

    // Мемоизация: кэшируем объект value, чтобы он не создавался заново при каждом рендере
    // useMemo принимает два параметра:
    //   1. Функцию, которая возвращает значение
    //   2. Массив зависимостей [user, loading]
    // Если user или loading не изменились, вернётся старый объект отсут обязательным
    // Это оптимизация: предотвращает ненужные ререндеры компонентов, использующих контекст
    const value = useMemo(() => ({ user, loading, signOut }), [user, loading]);

    // AuthContext.Provider - компонент, который делает данные доступными для всех дочерних компонентов
    // value - объект с данными, которые будут доступны через useContext
    // children - дочерние компоненты, которые будут иметь доступ к контексту
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
