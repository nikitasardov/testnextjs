import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-16 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center w-full">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Добро пожаловать в приложение
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Веб-приложение на Next.js с авторизацией, drag-and-drop функциональностью
            и управлением данными.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
            <Link
              href="/dnd-example"
              className="flex flex-col p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">
                Drag & Drop Игра
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Интерактивная игра с перетаскиванием элементов. Распределяйте элементы по областям,
                следите за ограничениями и получайте уведомления о действиях.
              </p>
              <span className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                Требуется авторизация →
              </span>
            </Link>

            <Link
              href="/dnd-15-puzzle"
              className="flex flex-col p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">
                15-puzzle (Пятнашки)
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Игра с 16 ячейками. В начале игры элементы автоматически
                распределяются случайным образом.
              </p>
              <span className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                Требуется авторизация →
              </span>
            </Link>

            <Link
              href="/users"
              className="flex flex-col p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">
                Пользователи
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Просмотр списка пользователей системы. Управление пользовательскими данными
                и профилями.
              </p>
              <span className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                Требуется авторизация →
              </span>
            </Link>

            <Link
              href="/product/1"
              className="flex flex-col p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">
                Продукты
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Просмотр информации о продуктах. Динамические страницы с данными из базы данных
                Supabase.
              </p>
              <span className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                Перейти →
              </span>
            </Link>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">
              Возможности приложения
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Авторизация через Supabase</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Защита страниц с помощью HOC</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Drag & Drop функциональность</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Система уведомлений</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Адаптивный дизайн</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Темная тема</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
