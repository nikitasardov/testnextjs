import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Опции конфигурации */

  // React Compiler - оптимизация React компонентов
  reactCompiler: true,

  // Strict Mode - дополнительные проверки в режиме разработки
  reactStrictMode: true,

  // Standalone режим для Docker деплоя
  // Создаёт минимальный .next/standalone папку со всем необходимым
  output: 'standalone',

  // Оптимизация изображений (если используете next/image)
  images: {
    // Разрешаем изображения с вашего домена Supabase
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
