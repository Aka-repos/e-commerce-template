export type ProductStatus = "active" | "draft" | "archived";
export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock" | "pre_order" | "discontinued";

export interface ProductImage {
  id: string; // UUID
  product_id: string; // FK to products
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string; // UUID
  product_id: string; // FK to products
  sku: string;
  name?: string; // e.g., "Color: Rojo, Talla: M"
  price_adjustment: number;
  stock_quantity: number;
  attributes: Record<string, string>; // JSONB
}

export interface Product {
  id: string; // UUID
  cod_ref: string; // Unique SKU/Reference
  name: string;
  slug: string; // Auto-generated from name
  description?: string;
  category_id: string; // FK to categories (UUID)

  base_price: number;
  unit: string; // 'metro', 'rollo', 'unidad', etc.
  weight?: number; // kg
  dimensions?: Record<string, number>; // JSONB: { width, height, depth }

  product_availability: ProductAvailability;
  stock_quantity: number;
  min_stock_alert: number;

  is_featured: boolean;
  is_active: boolean; // Controls visibility

  primary_image?: string; // From v_products_complete view

  // Relations
  images?: ProductImage[];
  variants?: ProductVariant[];

  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string; // Auto-generated from name
  description?: string;
  image?: string;
}

export const categories: Category[] = [
  {
    id: "telas",
    slug: "telas",
    name: "Telas",
    description: "Algodón, Lino, Seda, Poliéster y más",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "hilos",
    slug: "hilos",
    name: "Hilos",
    description: "Hilos de coser, bordar y tejer",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "botones",
    slug: "botones",
    name: "Botones",
    description: "Botones de todo tipo, tamaño y material",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "accesorios",
    slug: "accesorios",
    name: "Accesorios",
    description: "Cremalleras, cintas, elásticos y más",
    image: "/placeholder.svg?height=200&width=200",
  },
]
