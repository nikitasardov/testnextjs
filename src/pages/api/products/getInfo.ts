// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";
import { ApiError, ApiErrorCode } from "@/utils/api-error";
import { handleApiError } from "@/utils/api-error-handler";
import type { ApiResponse } from "@/types/api-response";

type ProductType = {
  id: number;
  name: string;
  created_at: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ProductType>>,
) {
  try {
    const locale = getLocaleFromRequest(req);
    const messages = getAllMessages(locale);

    if (req.method !== "GET") {
      throw new ApiError(ApiErrorCode.METHOD_NOT_ALLOWED, messages.api.methodNotAllowed);
    }

    const { product_id } = req.query;

    if (!product_id || typeof product_id !== 'string') {
      throw new ApiError(ApiErrorCode.MISSING_PARAMETER, messages.api.productIdRequired);
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', Number.parseInt(product_id, 10))
      .maybeSingle();

    if (error) {
      // Передаем оригинальную ошибку для логирования на сервере, но клиенту отправляем безопасное сообщение
      throw new ApiError(
        ApiErrorCode.INTERNAL_ERROR,
        messages.api.internalError,
        500,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (!data) {
      throw new ApiError(
        ApiErrorCode.NOT_FOUND,
        messages.products.notFound(product_id),
        404
      );
    }

    return res.status(200).json({
      success: true,
      data: data as ProductType,
    });
  } catch (error) {
    handleApiError(error, req, res);
  }
}
