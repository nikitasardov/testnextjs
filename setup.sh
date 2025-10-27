#!/bin/bash
# Скрипт для автоматической настройки правильной версии Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Текущая версия Node.js: $(node --version)"
echo "Переключение на Node.js 20..."
nvm use 20

echo "Проверка TypeScript:"
./node_modules/.bin/tsc --version

echo "Настройка завершена!"

