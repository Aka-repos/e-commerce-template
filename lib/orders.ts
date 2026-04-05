export type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;

  // Snapshots at purchase time (immutable)
  product_name: string;
  variant_name?: string;
  cod_ref: string;

  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string; // Auto-generated: ORD-20240115-000001
  customer_id: string;

  // Snapshot of customer info at purchase time
  customer_name?: string;
  customer_email?: string;

  status: OrderStatus;
  total_amount: number;

  // Shipping address snapshot
  shipping_address?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_postal_code?: string;
  shipping_country?: string;

  tracking_number?: string;
  shipping_carrier?: string;

  customer_notes?: string;
  admin_notes?: string;

  // Lifecycle timestamps
  paid_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  cancelled_at?: Date;

  created_at: Date;
  updated_at: Date;

  items?: OrderItem[];
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending_payment": return "Pendiente de Pago";
    case "payment_review":  return "Pago en Revisión";
    case "paid":            return "Pagado";
    case "processing":      return "En Proceso";
    case "shipped":         return "Enviado";
    case "delivered":       return "Entregado";
    case "cancelled":       return "Cancelado";
    case "refunded":        return "Reembolsado";
    default:                return status;
  }
}

export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case "pending_payment": return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
    case "payment_review":  return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
    case "paid":            return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
    case "processing":      return "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20";
    case "shipped":         return "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20";
    case "delivered":       return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
    case "cancelled":       return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
    case "refunded":        return "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20";
    default:                return "bg-gray-500/10 text-gray-700";
  }
}
