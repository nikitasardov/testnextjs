// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/utils/supabase";
import { getLocaleFromRequest } from "@/utils/i18n-api";
import { getAllMessages } from "@/locales/loadMessages";

type ProductType = {
  id: number;
  name: string;
  created_at: string;
};

type Data = {
  product: ProductType | null;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const locale = getLocaleFromRequest(req);
  const messages = getAllMessages(locale);

  if (req.method !== "GET") {
    return res.status(405).json({ product: null, error: messages.api.methodNotAllowed });
  }

  const { product_id } = req.query;

  if (!product_id || typeof product_id !== 'string') {
    return res.status(400).json({ product: null, error: messages.api.productIdRequired });
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', Number.parseInt(product_id, 10))
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        product: null,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        product: null,
        error: messages.products.notFound(product_id),
      });
    }

    return res.status(200).json({ product: data as ProductType });
  } catch (error) {
    return res.status(500).json({
      product: null,
      error: error instanceof Error ? error.message : messages.api.internalError,
    });
  }
}
