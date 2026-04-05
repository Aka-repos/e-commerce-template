export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled";

export type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "yappy" | "cash" | "other";

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;

  amount: number;
  currency: string; // Default: 'USD' (Panama uses USD)
  method: PaymentMethod;
  status: PaymentStatus;

  // Processor-agnostic fields
  // processor: 'stripe' | 'yappy' | 'payu' | 'manual'
  processor?: string;
  processor_transaction_id?: string;
  processor_response?: Record<string, unknown>; // Raw JSONB from processor

  // Card payments
  card_last_four?: string;
  card_brand?: string; // 'visa', 'mastercard', etc.

  // Bank transfer / manual payments
  bank_reference?: string;
  receipt_url?: string;

  // Yappy (Panamanian mobile payment)
  yappy_phone?: string;
  yappy_confirmation?: string;

  failure_reason?: string;

  created_at: Date;
  updated_at: Date;
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "pending":    return "Pendiente";
    case "processing": return "Procesando";
    case "completed":  return "Completado";
    case "failed":     return "Fallido";
    case "refunded":   return "Reembolsado";
    case "cancelled":  return "Cancelado";
    default:           return status;
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "credit_card":    return "Tarjeta de Crédito";
    case "debit_card":     return "Tarjeta de Débito";
    case "bank_transfer":  return "Transferencia Bancaria";
    case "yappy":          return "Yappy";
    case "cash":           return "Efectivo";
    case "other":          return "Otro";
    default:               return method;
  }
}
