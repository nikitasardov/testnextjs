import { Typography, Button, TextField } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
interface ProductType {id: number, name: string, created_at: string}

export default function Product() {
    const router = useRouter();
    const { product_id } = router.query;
    const [name, setName] = useState<string>('')
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

    useEffect(() => {
        console.log("имя: ", name);
    }, [name])

    const handleTestAPI = async () => {
        const response = await axios.get(`/api/products/getInfo`, {
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
                product_id: product_id,
            }
        });
        
        console.log(response.data);
    }

    return (
        <>
            <Typography variant="h1">Product Page</Typography>
            <Typography variant="body1">Product ID: {product_id}</Typography>
            <Typography variant="body1">Product Name: {productInfo?.name}</Typography>
            <TextField value={name} onChange={(e) => {setName(e.target.value)}} />
            <Button onClick={handleTestAPI}>Test API</Button>
        </>
    )
}