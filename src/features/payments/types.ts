import { CurrencyCode } from "../../types.base";
import { PaymentMethod } from "../debts/types";

export interface PaymentOutDetails {
    amount: number;
    currency: CurrencyCode;
    date: string;
    method: PaymentMethod;
    notes: string;
    paymentAccountId: string; // The asset account being credited (paid from)
    sendReceipt?: boolean;
}