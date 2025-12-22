
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Клиент для использования на клиенте (в компонентах React)
export const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Создает клиент Supabase для использования на сервере (в API routes)
 * @param useServiceRole - если true, использует service_role ключ (для админских операций)
 * @returns Supabase клиент
 */
export function createServerSupabaseClient(useServiceRole: boolean = false): SupabaseClient {
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

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
