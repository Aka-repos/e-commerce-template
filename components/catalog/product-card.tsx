"use client"

import type { Product } from "@/lib/products"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  product: Product
  onAddToQuote?: (product: Product) => void
}

export function ProductCard({ product, onAddToQuote }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover-lift group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.primary_image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.is_featured && <Badge className="absolute top-3 right-3 bg-primary shadow-lg">Destacado</Badge>}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 leading-relaxed">{product.description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-primary">${product.base_price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">/ {product.unit}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Stock: {product.stock_quantity} {product.unit}s
        </p>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Link href={`/producto/${product.id}`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent hover:bg-accent">
            Ver Detalles
          </Button>
        </Link>
        {onAddToQuote && (
          <Button onClick={() => onAddToQuote(product)} className="flex-1">
            Cotizar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
