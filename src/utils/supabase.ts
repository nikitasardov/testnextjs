
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Клиент для использования на клиенте (в компонентах React)
export const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Создает клиент Supabase для использования на сервере (в API routes)
 * @param useServiceRole - если true, использует service_role ключ (для админских операций)
 * @param accessToken - токен доступа пользователя (для работы с RLS политиками)
 * @returns Supabase клиент
 */
export function createServerSupabaseClient(useServiceRole: boolean = false, accessToken?: string): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = useServiceRole
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            useServiceRole
                ? 'Supabase service_role key is missing'
                : 'Supabase configuration is missing'
        );
    }

    const clientOptions: any = {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    };

    // Если передан токен доступа, добавляем его в опции клиента для работы с RLS
    if (accessToken && !useServiceRole) {
        // В Supabase JS 2.x правильный способ - использовать опцию global для установки заголовков
        clientOptions.global = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
    }

    const client = createClient(url, key, clientOptions);

    return client;
}
