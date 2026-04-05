import { Product } from "./products";

export type QuoteStatus = "pending" | "reviewed" | "approved" | "rejected" | "cancelled";

export interface QuoteItem {
  id?: string; // Optional if not yet saved
  quote_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;

  // UI helper (not in DB table directly, joined)
  product?: Partial<Product>;
}

export interface Quote {
  id: string;
  quote_number?: string; // Auto-generated: COT-20240115-000001
  customer_id: string;

  // Snapshot of customer info at time of quote (optional, or joined)
  customer_name?: string;
  customer_email?: string;

  status: QuoteStatus;
  total_amount: number;

  customer_notes?: string;
  admin_response?: string;

  created_at: Date;
  updated_at: Date;

  items: QuoteItem[];
}

export function getStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "reviewed":
      return "En Revisión";
    case "approved":
      return "Aprobada";
    case "rejected":
      return "Rechazada";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

export function getStatusColor(status: QuoteStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
    case "reviewed":
      return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
    case "approved":
      return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
    case "rejected":
      return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
    case "cancelled":
      return "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-700";
  }
}
