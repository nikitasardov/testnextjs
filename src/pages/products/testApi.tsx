import { Typography, Button, TextField, Box, Alert } from "@mui/material";
import axios from "axios";
import { useState } from "react";

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
    const [productId, setProductId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTestAPI = async () => {
        if (!productId.trim()) {
            setError('Введите ID товара');
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
                setError(err instanceof Error ? err.message : 'Ошибка при запросе к API');
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
                Тест API запроса товара
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <TextField
                    label="ID товара"
                    value={productId}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                            setProductId(value);
                        }
                    }}
                    placeholder="Введите ID товара"
                    type="text"
                    inputMode="numeric"
                    sx={{ minWidth: 200 }}
                />
                <Button
                    onClick={handleTestAPI}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Загрузка...' : 'Запросить'}
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
                        Данные товара:
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