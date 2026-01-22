import en from './en';
import es from './es';
import ru from './ru';
import type { AppLocale } from './config';

export const messagesByLocale = {
    ru,
    en,
    es,
} as const;

export type Messages = typeof messagesByLocale[AppLocale];
export type Namespace = keyof Messages;

