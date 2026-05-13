import dayjs from "dayjs";
import { useCurrencyStore } from "@/lib/currencyStore";

export const formatCurrency = (value: number, currency?: string): string => {
    // ✅ pull locale + currencyCode from store at call time
    const { currencyCode, locale } = useCurrencyStore.getState();
    const resolvedCurrency = currency ?? currencyCode;
    const resolvedLocale = locale;

    try {
        return new Intl.NumberFormat(resolvedLocale, {
            style: "currency",
            currency: resolvedCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${resolvedCurrency} ${value.toFixed(2)}`;
    }
};

export const formatSubscriptionDateTime = (value?: string): string => {
    if (!value) return "Not provided";
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
    if (!value) return "Unknown";
    return value.charAt(0).toUpperCase() + value.slice(1);
};