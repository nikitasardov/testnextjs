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

// Общие классы для переиспользования
const cardBase = "flex flex-col p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900";
const cardLink = `${cardBase} hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg`;
const cardTitle = "text-xl font-semibold mb-2 text-black dark:text-zinc-50";
const cardText = "text-zinc-600 dark:text-zinc-400 text-sm";
const cardFooter = "mt-4 text-sm font-medium text-blue-600 dark:text-blue-400";
const buttonLink = "px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors";

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
            <Link href="/dnd/example" className={cardLink}>
              <h2 className={cardTitle}>Drag & Drop Игра</h2>
              <p className={cardText}>
                Интерактивная игра с перетаскиванием элементов. Распределяйте элементы по областям,
                следите за ограничениями и получайте уведомления о действиях. Изменения сохраняются сразу.
              </p>
              <span className={cardFooter}>Требуется авторизация →</span>
            </Link>

            <Link href="/dnd/15-puzzle" className={cardLink}>
              <h2 className={cardTitle}>15-puzzle (Пятнашки)</h2>
              <p className={cardText}>
                Игра с 16 ячейками. В начале игры элементы автоматически
                распределяются случайным образом. Сохранение игры нажатием кнопки.{' '}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">AI-подсказки для оптимальных ходов.</span>
              </p>
              <span className={cardFooter}>Требуется авторизация →</span>
            </Link>

            <Link href="/users" className={cardLink}>
              <h2 className={cardTitle}>Пользователи</h2>
              <p className={cardText}>
                Просмотр списка пользователей системы. Управление пользовательскими данными
                и профилями.
              </p>
              <span className={cardFooter}>Требуется авторизация →</span>
            </Link>

            <div className={cardBase}>
              <h2 className={cardTitle}>Продукты</h2>
              <p className={`${cardText} mb-4`}>
                Просмотр информации о продуктах. Динамические страницы с данными из Supabase.
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                <Link href="/products" className={buttonLink}>Список товаров</Link>
                <Link href="/products/100" className={buttonLink}>Товар #100</Link>
                <Link href="/products/150" className={buttonLink}>Товар #150</Link>
                <Link href="/products/testApi" className={buttonLink}>Тест API</Link>
              </div>
            </div>
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
                <span>Темная тема</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>AI-подсказки для игры 15-puzzle</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
