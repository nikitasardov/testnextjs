-- Создание таблицы для хранения конфигураций игр
CREATE TABLE IF NOT EXISTS game_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL CHECK (game_type IN ('example', '15-puzzle')),
    droppables JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_type)
);
-- Создание индекса для быстрого поиска по user_id и game_type
CREATE INDEX IF NOT EXISTS idx_game_configs_user_game ON game_configs(user_id, game_type);
-- Включение Row Level Security (RLS)
ALTER TABLE game_configs ENABLE ROW LEVEL SECURITY;
-- Политика RLS: пользователи могут читать только свои конфигурации
CREATE POLICY "Users can read their own game configs" ON game_configs FOR
SELECT USING (auth.uid() = user_id);
-- Политика RLS: пользователи могут создавать только свои конфигурации
CREATE POLICY "Users can insert their own game configs" ON game_configs FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Политика RLS: пользователи могут обновлять только свои конфигурации
CREATE POLICY "Users can update their own game configs" ON game_configs FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Политика RLS: пользователи могут удалять только свои конфигурации
CREATE POLICY "Users can delete their own game configs" ON game_configs FOR DELETE USING (auth.uid() = user_id);
-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_game_configs_updated_at BEFORE
UPDATE ON game_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();