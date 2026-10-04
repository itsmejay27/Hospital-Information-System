import { Bill } from "../types";

export const billGross = (b: Bill) => b.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
export const billNet = (b: Bill) => Math.max(0, billGross(b) - (b.philhealthDeduction || 0) - (b.discountAmount || 0));
export const billPaid = (b: Bill) => b.payments.reduce((s, p) => s + p.amount, 0);
export const billBalance = (b: Bill) => (b.status === "Cancelled" ? 0 : Math.max(0, Math.round((billNet(b) - billPaid(b)) * 100) / 100));

/** Senior citizen / PWD discount: 20% of the amount left after PhilHealth. */
export const statutoryDiscount = (gross: number, philhealth: number) => Math.round(Math.max(0, gross - philhealth) * 0.2 * 100) / 100;
