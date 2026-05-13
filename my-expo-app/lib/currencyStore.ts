// lib/currencyStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const CURRENCY_KEY = 'selectedCurrency';

export interface CountryOption {
    flag: string;
    country: string;
    currency: string;
    code: string;
    locale: string;
}

export const COUNTRIES: CountryOption[] = [
    { flag: '🇺🇸', country: 'United States',      currency: 'US Dollar',         code: 'USD', locale: 'en-US' },
    { flag: '🇮🇳', country: 'India',               currency: 'Indian Rupee',      code: 'INR', locale: 'en-IN' },
    { flag: '🇬🇧', country: 'United Kingdom',      currency: 'British Pound',     code: 'GBP', locale: 'en-GB' },
    { flag: '🇪🇺', country: 'Europe',              currency: 'Euro',              code: 'EUR', locale: 'de-DE' },
    { flag: '🇦🇺', country: 'Australia',           currency: 'Australian Dollar', code: 'AUD', locale: 'en-AU' },
    { flag: '🇨🇦', country: 'Canada',              currency: 'Canadian Dollar',   code: 'CAD', locale: 'en-CA' },
    { flag: '🇯🇵', country: 'Japan',               currency: 'Japanese Yen',      code: 'JPY', locale: 'ja-JP' },
    { flag: '🇨🇭', country: 'Switzerland',         currency: 'Swiss Franc',       code: 'CHF', locale: 'de-CH' },
    { flag: '🇸🇬', country: 'Singapore',           currency: 'Singapore Dollar',  code: 'SGD', locale: 'en-SG' },
    { flag: '🇦🇪', country: 'UAE',                 currency: 'UAE Dirham',        code: 'AED', locale: 'ar-AE' },
    { flag: '🇸🇦', country: 'Saudi Arabia',        currency: 'Saudi Riyal',       code: 'SAR', locale: 'ar-SA' },
    { flag: '🇧🇷', country: 'Brazil',              currency: 'Brazilian Real',    code: 'BRL', locale: 'pt-BR' },
    { flag: '🇲🇽', country: 'Mexico',              currency: 'Mexican Peso',      code: 'MXN', locale: 'es-MX' },
    { flag: '🇰🇷', country: 'South Korea',         currency: 'Korean Won',        code: 'KRW', locale: 'ko-KR' },
    { flag: '🇨🇳', country: 'China',               currency: 'Chinese Yuan',      code: 'CNY', locale: 'zh-CN' },
    { flag: '🇿🇦', country: 'South Africa',        currency: 'South African Rand',code: 'ZAR', locale: 'en-ZA' },
    { flag: '🇳🇬', country: 'Nigeria',             currency: 'Nigerian Naira',    code: 'NGN', locale: 'en-NG' },
    { flag: '🇹🇷', country: 'Turkey',              currency: 'Turkish Lira',      code: 'TRY', locale: 'tr-TR' },
    { flag: '🇮🇩', country: 'Indonesia',           currency: 'Indonesian Rupiah', code: 'IDR', locale: 'id-ID' },
    { flag: '🇲🇾', country: 'Malaysia',            currency: 'Malaysian Ringgit', code: 'MYR', locale: 'ms-MY' },
    { flag: '🇵🇭', country: 'Philippines',         currency: 'Philippine Peso',   code: 'PHP', locale: 'en-PH' },
    { flag: '🇹🇭', country: 'Thailand',            currency: 'Thai Baht',         code: 'THB', locale: 'th-TH' },
    { flag: '🇵🇰', country: 'Pakistan',            currency: 'Pakistani Rupee',   code: 'PKR', locale: 'en-PK' },
    { flag: '🇧🇩', country: 'Bangladesh',          currency: 'Bangladeshi Taka',  code: 'BDT', locale: 'bn-BD' },
    { flag: '🇷🇺', country: 'Russia',              currency: 'Russian Ruble',     code: 'RUB', locale: 'ru-RU' },
    { flag: '🇵🇱', country: 'Poland',              currency: 'Polish Złoty',      code: 'PLN', locale: 'pl-PL' },
    { flag: '🇸🇪', country: 'Sweden',              currency: 'Swedish Krona',     code: 'SEK', locale: 'sv-SE' },
    { flag: '🇳🇴', country: 'Norway',              currency: 'Norwegian Krone',   code: 'NOK', locale: 'nb-NO' },
    { flag: '🇩🇰', country: 'Denmark',             currency: 'Danish Krone',      code: 'DKK', locale: 'da-DK' },
    { flag: '🇳🇿', country: 'New Zealand',         currency: 'NZ Dollar',         code: 'NZD', locale: 'en-NZ' },
];

interface CurrencyStore {
    currencyCode: string;
    locale: string;
    region: string;
    setCurrency: (code: string, locale: string, region: string) => Promise<void>;
    loadCurrency: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>((set) => ({
    currencyCode: 'USD',
    locale: 'en-US',
    region: 'United States',

    setCurrency: async (code, locale, region) => {
        await SecureStore.setItemAsync(
            CURRENCY_KEY,
            JSON.stringify({ code, locale, region })
        );
        set({ currencyCode: code, locale, region });
    },

    // ✅ Safe fallbacks — handles old SecureStore data without region field
    loadCurrency: async () => {
        const saved = await SecureStore.getItemAsync(CURRENCY_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            set({
                currencyCode: parsed.code ?? 'USD',
                locale: parsed.locale ?? 'en-US',
                region: parsed.region ?? 'United States',
            });
        }
    },
}));

export function useCurrencyFormatter() {
    const { currencyCode, locale } = useCurrencyStore();
    return (amount: number) => {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${currencyCode} ${amount.toFixed(2)}`;
        }
    };
}