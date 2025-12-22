import { useState, useEffect } from "react";
import { withAuth } from "@/components/withAuth";

interface User {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
}

function Users() {
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

                if (!response.ok) {
                    throw new Error(data.error || "Ошибка при загрузке пользователей");
                }

                setUsers(data.users || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Неизвестная ошибка");
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "Никогда";
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
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
                    Пользователи системы
                </h1>

                {loading && (
                    <div className="text-center py-8">
                        <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                        <p>Ошибка: {error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="mb-4 text-zinc-600 dark:text-zinc-400">
                            Всего пользователей: {users.length}
                        </div>

                        {users.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Пользователи не найдены
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
                                                    {user.email || "Без email"}
                                                </h3>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                                                    <p>
                                                        <span className="font-medium">ID:</span>{" "}
                                                        <span className="font-mono text-xs">
                                                            {user.id}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">
                                                            Дата регистрации:
                                                        </span>{" "}
                                                        {formatDate(user.created_at)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">
                                                            Последний вход:
                                                        </span>{" "}
                                                        {formatDate(user.last_sign_in_at || "")}
                                                    </p>
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