"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Footer } from "@/components/layout/footer"
import { type Product } from "@/lib/products"

interface ProductDetailProps {
    product: Product | undefined
}

export function ProductDetail({ product }: ProductDetailProps) {
    const router = useRouter()
    const [quantity, setQuantity] = useState(1)
    const [cartCount, setCartCount] = useState(0)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const cart = JSON.parse(localStorage.getItem("quoteCart") || "[]")
            setCartCount(cart.length)
        }
    }, [])

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
                        <Link href="/catalogo">
                            <Button>Volver al Catálogo</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const handleAddToQuote = () => {
        const user = getCurrentUser()
        if (!user) {
            router.push("/login")
            return
        }

        if (typeof window !== "undefined") {
            const cart = JSON.parse(localStorage.getItem("quoteCart") || "[]")
            const existingItemIndex = cart.findIndex((item: any) => item.product.id === product.id)

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += quantity
                cart[existingItemIndex].subtotal = cart[existingItemIndex].quantity * cart[existingItemIndex].unit_price
            } else {
                cart.push({
                    product_id: product.id,
                    quantity,
                    unit_price: product.base_price,
                    subtotal: product.base_price * quantity,
                    product
                })
            }

            localStorage.setItem("quoteCart", JSON.stringify(cart))
            setCartCount(cart.length)
            router.push("/carrito")
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar cartItemCount={cartCount} />

            <main className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    <Link href="/catalogo">
                        <Button variant="ghost" className="mb-6 hover:translate-x-1 transition-transform">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Catálogo
                        </Button>
                    </Link>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                        <div className="space-y-4">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                                <Image
                                    src={product.primary_image || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {product.is_featured && <Badge className="absolute top-4 right-4 bg-primary shadow-lg">Destacado</Badge>}
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                    >
                                        <Image
                                            src={product.primary_image || "/placeholder.svg"}
                                            alt={`${product.name} - Vista ${i}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">{product.name}</h1>
                                <p className="text-lg text-muted-foreground leading-relaxed text-pretty">{product.description}</p>
                            </div>

                            <Card className="hover-lift">
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-primary">${product.base_price.toFixed(2)}</span>
                                            <span className="text-lg text-muted-foreground">/ {product.unit}</span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Stock disponible:</span>
                                                <span className="text-muted-foreground">
                                                    {product.stock_quantity} {product.unit}s
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">Categoría:</span>
                                                <Badge variant="secondary">{product.category_id}</Badge>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className="text-base">
                                        Cantidad ({product.unit}s)
                                    </Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="h-12 w-12"
                                        >
                                            -
                                        </Button>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            max={product.stock_quantity}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, Number(e.target.value))))}
                                            className="text-center text-lg h-12"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                            disabled={quantity >= product.stock_quantity}
                                            className="h-12 w-12"
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                <Button onClick={handleAddToQuote} size="lg" className="w-full h-12 text-base">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Agregar a Cotización
                                </Button>

                                <p className="text-sm text-muted-foreground text-center bg-muted p-3 rounded-lg">
                                    Total estimado:{" "}
                                    <span className="font-bold text-foreground">${(product.base_price * quantity).toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
