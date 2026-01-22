import { useState } from 'react';
import { Button, Menu, MenuItem, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { locales, type AppLocale } from '@/locales/config';
import { useLocale } from '@/contexts/LocaleContext';

const localeNames: Record<string, string> = {
    ru: 'Русский',
    en: 'English',
    es: 'Español',
};

export default function LanguageSwitcher() {
    const { locale: currentLocale, updateLocale } = useLocale();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLocaleChange = (locale: AppLocale) => {
        updateLocale(locale);
        handleClose();
    };

    return (
        <Box>
            <Button
                onClick={handleClick}
                startIcon={<LanguageIcon />}
                sx={{ color: 'inherit', textTransform: 'none' }}
            >
                {localeNames[currentLocale] || currentLocale}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {locales.map((locale) => (
                    <MenuItem
                        key={locale}
                        onClick={() => handleLocaleChange(locale)}
                        selected={locale === currentLocale}
                    >
                        {localeNames[locale]}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

