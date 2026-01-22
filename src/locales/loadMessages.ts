import { defaultLocale, locales, type AppLocale } from './config';
import { messagesByLocale, type Messages, type Namespace } from './messages';

function normalizeLocale(locale?: string): AppLocale {
  if (locale && (locales as readonly string[]).includes(locale)) {
    return locale as AppLocale;
  }
  return defaultLocale;
}

export function getAllMessages(locale?: string): Messages {
  const normalized = normalizeLocale(locale);
  return messagesByLocale[normalized];
}

export function getMessages(locale: string | undefined, namespaces?: Namespace[]): Partial<Messages> | Messages {
  const all = getAllMessages(locale);
  if (!namespaces || namespaces.length === 0) return all;

  const result: Partial<Messages> = {};
  for (const ns of namespaces) {
    // Используем type assertion для обхода readonly свойств
    (result as Record<Namespace, Messages[Namespace]>)[ns] = all[ns];
  }
  return result;
}


