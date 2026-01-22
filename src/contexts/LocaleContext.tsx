import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AppLocale, locales } from '@/locales/config';
import { getAllMessages } from '@/locales/loadMessages';
import type { Messages } from '@/locales/messages';
import { getCookie, setCookie } from '@/utils/cookies';

interface LocaleContextType {
    locale: AppLocale;
    messages: Messages;
    updateLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
    initialLocale,
    initialMessages,
    children,
}: Readonly<{
    initialLocale: AppLocale;
    initialMessages: Messages;
    children: ReactNode;
}>) {
    const [locale, setLocale] = useState<AppLocale>(initialLocale);
    const [messages, setMessages] = useState<Messages>(initialMessages);

    // Загружаем начальную локаль из cookie при монтировании (клиентская сторона)
    useEffect(() => {
        const cookieLocale = getCookie('locale');
        if (cookieLocale && locales.includes(cookieLocale as AppLocale)) {
            const newLocale = cookieLocale as AppLocale;
            if (newLocale !== initialLocale) {
                // Синхронизируем состояние с cookie при монтировании
                setLocale(newLocale);
                setMessages(getAllMessages(newLocale));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateLocale = (newLocale: AppLocale) => {
        setCookie('locale', newLocale);
        setLocale(newLocale);
        setMessages(getAllMessages(newLocale));
    };

    const contextValue = useMemo(
        () => ({ locale, messages, updateLocale }),
        [locale, messages]
    );

    return (
        <LocaleContext.Provider value={contextValue}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
}

