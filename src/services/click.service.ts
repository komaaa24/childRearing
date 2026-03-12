import crypto from "crypto";

export interface PaymentParams {
    amount: number;
    transactionParam: string;
    userId?: number; // Telegram ID (ixtiyoriy)
    returnUrl?: string; // To'lovdan keyin qaytish URL'i
}

export interface PaymentLink {
    url: string;
    transactionParam: string;
}

/**
 * Oddiy to'lov linkini yaratish (user_id va return_url bilan)
 */
export function generatePaymentLink(params: PaymentParams): PaymentLink {
    const { amount, transactionParam, userId, returnUrl } = params;
    const baseUrl = process.env.PAYMENT_URL || "http://213.230.110.176:9999/pay";

    // Base URL
    let url = `${baseUrl}?amount=${amount}&tx=${transactionParam}`;

    // user_id qo'shish (agar mavjud bo'lsa)
    if (userId) {
        url += `&user_id=${userId}`;
    }

    // return_url qo'shish (to'lovdan keyin qaytish uchun)
    if (returnUrl) {
        url += `&return_url=${encodeURIComponent(returnUrl)}`;
    }

    return {
        url,
        transactionParam
    };
}

/**
 * Transaction param generatsiya qilish (UUID)
 */
export function generateTransactionParam(): string {
    return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Qat'iy narxni olish
 */
export function getFixedPaymentAmount(): number {
    return 1111; // Qat'iy narx
}
