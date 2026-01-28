import { useState, useEffect } from "react";
import { withAuth } from "@/components/withAuth";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";

interface UserSettings {
    telegram_bot_token: string | null;
    telegram_chat_id: string | null;
}

function Settings() {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        telegram_bot_token: null,
        telegram_chat_id: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Получаем токен доступа
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    throw new Error('No session');
                }

                const response = await fetch("/api/settings", {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    // Новый формат: data.error.message или data.error (строка)
                    const errorMessage = data.error?.message || data.error || t('loadError');
                    throw new Error(errorMessage);
                }

                // Новый формат: data.data вместо data.settings
                setSettings(data.data || {
                    telegram_bot_token: null,
                    telegram_chat_id: null,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : t('unknownError'));
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [user, t]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            // Получаем токен доступа
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No session');
            }

            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    telegram_bot_token: settings.telegram_bot_token || null,
                    telegram_chat_id: settings.telegram_chat_id || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Новый формат: data.error.message или data.error (строка)
                const errorMessage = data.error?.message || data.error || t('saveError');
                throw new Error(errorMessage);
            }

            setSuccess(true);
            // Скрываем сообщение об успехе через 3 секунды
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('unknownError'));
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof UserSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value || null,
        }));
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-black dark:text-zinc-50">
                    {t('title')}
                </h1>

                {loading && (
                    <div className="text-center py-8">
                        <p className="text-zinc-600 dark:text-zinc-400">{tCommon('loading')}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                        <p>{t('errorPrefix')}: {error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
                        <p>{t('saveSuccess')}</p>
                    </div>
                )}

                {!loading && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                                {t('telegramSettings')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="telegram_bot_token"
                                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                                    >
                                        {t('telegramBotToken')}
                                    </label>
                                    <input
                                        type="text"
                                        id="telegram_bot_token"
                                        name="telegram_bot_token"
                                        value={settings.telegram_bot_token || ''}
                                        onChange={(e) => handleInputChange('telegram_bot_token', e.target.value)}
                                        placeholder={t('telegramBotTokenPlaceholder')}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                        {t('telegramBotTokenHint')}
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="telegram_chat_id"
                                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                                    >
                                        {t('telegramChatId')}
                                    </label>
                                    <input
                                        type="text"
                                        id="telegram_chat_id"
                                        name="telegram_chat_id"
                                        value={settings.telegram_chat_id || ''}
                                        onChange={(e) => handleInputChange('telegram_chat_id', e.target.value)}
                                        placeholder={t('telegramChatIdPlaceholder')}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                        {/* {t('telegramChatIdHint')} */}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {saving ? t('saving') : t('save')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default withAuth(Settings);


