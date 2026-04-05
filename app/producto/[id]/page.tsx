import { use } from "react"
import { getProductById } from "@/app/actions/products"
import { ProductDetail } from "@/components/catalog/product-detail"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const product = await getProductById(resolvedParams.id)

  // We pass the product to the client component. 
  // It handles the "Not Found" UI if product is undefined.
  return <ProductDetail product={product} />
}
