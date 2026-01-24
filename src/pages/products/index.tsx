import { Typography, Box, List, ListItem, ListItemText, CircularProgress, Alert, ListItemButton } from "@mui/material";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface ProductType {
    id: number,
    name: string,
    created_at: string
}

export default function Products() {
    const t = useTranslations('products');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getDateLocale = (loc: string): string => {
        const localeMap: Record<string, string> = {
            'ru': 'ru-RU',
            'en': 'en-US',
            'es': 'es-ES',
            'kk': 'kk-KZ',
            'zh': 'zh-CN',
            'ko': 'ko-KR',
            'ja': 'ja-JP',
        };
        return localeMap[loc] || 'ru-RU';
    };

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
                setError(err instanceof Error ? err.message : t('loadError'));
                console.error('Ошибка загрузки товаров:', err);
            } finally {
                setLoading(false);
            }
        }

        getProducts();
    }, [t]);

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
                {t('listTitle')}
            </Typography>
            {products.length === 0
                ? (
                    <Typography variant="body1" color="text.secondary">
                        {t('productsNotFound')}
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
                                            secondary={`${tCommon('id')}: ${product.id} • ${t('created')}: ${new Date(product.created_at).toLocaleString(getDateLocale(locale))}`}
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

