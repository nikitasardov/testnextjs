import en from './en';
import es from './es';
import ru from './ru';
import kk from './kk';
import zh from './zh';
import ko from './ko';
import ja from './ja';
import type { AppLocale } from './config';

export const messagesByLocale = {
    ru,
    en,
    es,
    kk,
    zh,
    ko,
    ja,
} as const;

export type Messages = typeof messagesByLocale[AppLocale];
export type Namespace = keyof Messages;

