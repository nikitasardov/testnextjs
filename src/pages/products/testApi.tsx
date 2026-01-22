import { Typography, Button, TextField, Box, Alert } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface ProductType {
    id: number;
    name: string;
    created_at: string;
}

interface ApiResponse {
    product: ProductType | null;
    error?: string;
}

export default function TestApi() {
    const t = useTranslations('products');
    const tCommon = useTranslations('common');
    const [productId, setProductId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTestAPI = async () => {
        if (!productId.trim()) {
            setError(t('enterId'));
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const response = await axios.get(`/api/products/getInfo`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    product_id: productId,
                },
                validateStatus: (status) => status < 500, // Принимаем статусы < 500 как успешные
            });

            if (response.data.error) {
                setError(response.data.error);
                setResult(null);
            } else {
                setResult(response.data);
                setError(null);
            }
            console.log(response.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data as ApiResponse;
                setError(errorData.error || err.message);
                setResult(null);
            } else {
                setError(err instanceof Error ? err.message : t('requestError'));
                setResult(null);
            }
            console.error('Ошибка запроса:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box p={3}>
            <Typography variant="h4" component="h1" gutterBottom>
                {t('testApiTitle')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <TextField
                    label={t('productId')}
                    value={productId}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                            setProductId(value);
                        }
                    }}
                    placeholder={t('enterId')}
                    type="text"
                    inputMode="numeric"
                    sx={{ minWidth: 200 }}
                />
                <Button
                    onClick={handleTestAPI}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? tCommon('loading') : t('request')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {result?.product && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('productData')}:
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            background: (theme) => theme.palette.mode === 'dark'
                                ? theme.palette.grey[800]
                                : theme.palette.grey[100],
                            color: (theme) => theme.palette.text.primary,
                            padding: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        {JSON.stringify(result.product, null, 2)}
                    </Box>
                </Box>
            )}
        </Box>
    );
}