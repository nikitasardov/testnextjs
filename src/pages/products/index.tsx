import { Typography, Box, List, ListItem, ListItemText, CircularProgress, Alert, ListItemButton } from "@mui/material";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import Link from "next/link";

interface ProductType {
    id: number,
    name: string,
    created_at: string
}

export default function Products() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getProducts() {
            try {
                setLoading(true);
                setError(null);
                const { data, error: supabaseError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (supabaseError) {
                    throw supabaseError;
                }

                if (data) {
                    setProducts(data as ProductType[]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка при загрузке товаров');
                console.error('Ошибка загрузки товаров:', err);
            } finally {
                setLoading(false);
            }
        }

        getProducts();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" component="h1" gutterBottom>
                Список товаров
            </Typography>
            {products.length === 0
                ? (
                    <Typography variant="body1" color="text.secondary">
                        Товары не найдены
                    </Typography>
                )
                : (
                    <List>
                        {products.map((product) => (
                            <ListItem key={product.id} divider disablePadding>
                                <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                                    <ListItemButton>
                                        <ListItemText
                                            primary={product.name}
                                            secondary={`ID: ${product.id} • Создан: ${new Date(product.created_at).toLocaleString('ru-RU')}`}
                                        />
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                )}
        </Box>
    );
}

