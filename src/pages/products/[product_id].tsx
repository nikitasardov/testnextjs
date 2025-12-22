import { Typography } from "@mui/material";
import { useRouter } from "next/router";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";

interface ProductType {
    id: number,
    name: string,
    created_at: string
}

export default function Product() {
    const router = useRouter();
    const { product_id } = router.query;
    const [productInfo, setProductInfo] = useState<ProductType|null>(null)
    useEffect(() => {
        async function getProduct() {
            const data = await supabase.from('products').select('*').eq('id', product_id).maybeSingle();
            if (data.data) {
                setProductInfo(data.data as ProductType)
            }
            console.log(data)
        }

        getProduct()
    }, [product_id])

    return (
        <>
            <Typography variant="h1">Product Page</Typography>
            <Typography variant="body1">Product ID: {product_id}</Typography>
            <Typography variant="body1">Product Name: {productInfo?.name}</Typography>
        </>
    )
}