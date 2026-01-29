import { useState, useEffect } from "react";
import { withAuth } from "@/components/withAuth";
import { useTranslations, useLocale } from "next-intl";

interface User {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    last_activity_at?: string;
}

function Users() {
    const t = useTranslations('users');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/api/users");
                const data = await response.json();

                if (!response.ok || !data.success) {
                    // Новый формат: data.error.message или data.error (строка)
                    const errorMessage = data.error?.message || data.error || t('loadError');
                    throw new Error(errorMessage);
                }

                // Новый формат: data.data вместо data.users
                setUsers(data.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : t('unknownError'));
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [t]);

    const formatDate = (dateString: string) => {
        if (!dateString) return tCommon('never');
        const date = new Date(dateString);

        // Кастомные названия месяцев для казахского языка
        const kazakhMonths: Record<number, string> = {
            0: 'қаңтар',
            1: 'ақпан',
            2: 'наурыз',
            3: 'сәуір',
            4: 'мамыр',
            5: 'маусым',
            6: 'шілде',
            7: 'тамыз',
            8: 'қыркүйек',
            9: 'қазан',
            10: 'қараша',
            11: 'желтоқсан',
        };

        // Маппинг локалей для toLocaleString
        const localeMap: Record<string, string> = {
            'ru': 'ru-RU',
            'en': 'en-US',
            'es': 'es-ES',
            'kk': 'kk-KZ',
            'zh': 'zh-CN',
            'ko': 'ko-KR',
            'ja': 'ja-JP',
        };
        const dateLocale = localeMap[locale] || 'ru-RU';

        // Для казахского языка используем кастомное форматирование
        if (locale === 'kk') {
            const day = date.getDate();
            const month = kazakhMonths[date.getMonth()];
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year} ж. ${day} ${month}, ${hours}:${minutes}`;
        }

        return date.toLocaleString(dateLocale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-black dark:text-zinc-50">
                    {t('title')}
                </h1>

                {loading && (
                    <div className="text-center py-8">
                        <p className="text-zinc-600 dark:text-zinc-400">{t('loading')}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                        <p>{t('errorPrefix')}: {error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="mb-4 text-zinc-600 dark:text-zinc-400">
                            {t('totalUsers')}: {users.length}
                        </div>

                        {users.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    {t('usersNotFound')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
                                                    {user.email || tCommon('withoutEmail')}
                                                </h3>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                                                    <p>
                                                        <span className="font-medium">{tCommon('id')}:</span>{" "}
                                                        <span className="font-mono text-xs">
                                                            {user.id}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">
                                                            {t('registrationDate')}:
                                                        </span>{" "}
                                                        {formatDate(user.created_at)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">
                                                            {t('lastSignIn')}:
                                                        </span>{" "}
                                                        {formatDate(user.last_sign_in_at || "")}
                                                    </p>
                                                    {user.last_activity_at && (
                                                        <p>
                                                            <span className="font-medium">
                                                                {t('lastActivity')}:
                                                            </span>{" "}
                                                            {formatDate(user.last_activity_at)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default withAuth(Users);