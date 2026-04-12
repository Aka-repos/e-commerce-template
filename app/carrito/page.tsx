"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import { createQuote } from "@/app/actions/quotes"
import { type QuoteItem } from "@/lib/quotes"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function CarritoPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<QuoteItem[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [user] = useState(() => getCurrentUser())

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const cart = JSON.parse(localStorage.getItem("quoteCart") || "[]")
    setCartItems(cart)
  }, [user?.id, router])

  const updateQuantity = (index: number, newQuantity: number) => {
    const updatedCart = [...cartItems]
    const product = updatedCart[index].product
    if (!product) return

    const quantity = Math.max(1, Math.min(product.stock_quantity || 0, newQuantity))
    updatedCart[index].quantity = quantity
    updatedCart[index].subtotal = quantity * updatedCart[index].unit_price

    setCartItems(updatedCart)
    localStorage.setItem("quoteCart", JSON.stringify(updatedCart))
  }

  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index)
    setCartItems(updatedCart)
    localStorage.setItem("quoteCart", JSON.stringify(updatedCart))
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const handleSubmitQuote = async () => {
    if (!user || cartItems.length === 0) return

    setLoading(true)

    try {
      // Create quote object matching Omit<Quote, ...>
      const quoteData = {
        customer_id: user.id,
        customer_name: user.name, // optional in interface
        customer_email: user.email, // optional
        total_amount: calculateTotal(),
        customer_notes: notes,
        status: "pending" as const,
        items: cartItems.map(item => ({
          product_id: item.product_id, // Ensure this exists. If cart item structure is different, fix it.
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        }))
      }

      const quote = await createQuote(quoteData)

      if (quote) {
        // Clear cart
        localStorage.removeItem("quoteCart")
        // Redirect to quotes page
        router.push(`/cotizaciones?new=${quote.id}`)
      }
    } catch (error) {
      console.error("Error creating quote:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartItemCount={cartItems.length} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Carrito de Cotización</h1>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
                <p className="text-muted-foreground mb-6">Agrega productos para solicitar una cotización</p>
                <Link href="/catalogo">
                  <Button size="lg">Explorar Catálogo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Productos Seleccionados</CardTitle>
                    <CardDescription>{cartItems.length} productos en tu carrito</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cartItems.map((item, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={item.product?.primary_image || "/placeholder.svg"}
                              alt={item.product?.name || "Producto"}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{item.product?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${item.unit_price.toFixed(2)} / {item.product?.unit}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.product?.stock_quantity}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, Number(e.target.value))}
                                className="w-16 text-center h-8"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                disabled={item.quantity >= (item.product?.stock_quantity || 0)}
                              >
                                +
                              </Button>
                              <span className="text-sm text-muted-foreground ml-2">{item.product?.unit}s</span>
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                    <CardDescription>Agrega información adicional sobre tu cotización (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Ej: Fecha de entrega deseada, especificaciones adicionales, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.product?.name} x{item.quantity}
                          </span>
                          <span>${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Estimado</span>
                      <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Este es un monto estimado. El precio final será confirmado por nuestro equipo.
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-3">
                    <Button onClick={handleSubmitQuote} disabled={loading} className="w-full" size="lg">
                      {loading ? "Enviando..." : "Solicitar Cotización"}
                    </Button>
                    <Link href="/catalogo" className="w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        Continuar Comprando
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-muted/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Ecommerce Name. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
