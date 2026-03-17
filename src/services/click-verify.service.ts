import axios from "axios";
import crypto from "crypto";

interface ClickPaymentStatusResponse {
    error_code: number;
    error_note: string;
    payment_id?: number;
    payment_status?: number;
}

function buildClickAuthHeader(): string {
    const merchantUserId = (process.env.CLICK_MERCHANT_USER_ID || "").trim();
    const secretKey = (process.env.CLICK_SECRET_KEY || "").trim();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const digest = crypto.createHash("sha1").update(timestamp + secretKey).digest("hex");
    return `${merchantUserId}:${digest}:${timestamp}`;
}

function getClickConfig() {
    const serviceId = (process.env.CLICK_SERVICE_ID || "").trim();
    const merchantUserId = (process.env.CLICK_MERCHANT_USER_ID || "").trim();
    const secretKey = (process.env.CLICK_SECRET_KEY || "").trim();

    if (!serviceId || !merchantUserId || !secretKey) {
        return null;
    }

    return { serviceId, merchantUserId, secretKey };
}

/**
 * Click Merchant API orqali to'lov holatini tekshirish (merchant_trans_id bo'yicha).
 * API: GET /payment/status_by_mti/:service_id/:merchant_trans_id/YYYY-MM-DD
 */
export async function verifyClickPaymentByMTI(merchantTransId: string, createdAt: Date): Promise<{
    ok: boolean;
    paymentStatus?: number;
    errorCode?: number;
    errorNote?: string;
}> {
    const cfg = getClickConfig();
    if (!cfg) {
        return { ok: false, errorNote: "missing_click_config" };
    }

    const date = createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const url = `https://api.click.uz/v2/merchant/payment/status_by_mti/${cfg.serviceId}/${merchantTransId}/${date}`;

    const res = await axios.get<ClickPaymentStatusResponse>(url, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Auth: buildClickAuthHeader()
        },
        timeout: 10000
    });

    const data = res.data;
    const errorCode = Number(data?.error_code);
    const paymentStatus = typeof data?.payment_status === "number" ? data.payment_status : undefined;

    if (errorCode !== 0) {
        return {
            ok: false,
            errorCode,
            errorNote: data?.error_note || "click_error"
        };
    }

    return {
        ok: true,
        paymentStatus
    };
}
