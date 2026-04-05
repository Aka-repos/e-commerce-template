"use client"

import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getStatusLabel, getStatusColor, type Quote } from "@/lib/quotes"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface QuoteDetailProps {
    quote: Quote
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link href="/cotizaciones">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Mis Cotizaciones
                        </Button>
                    </Link>

                    <Card>
                        <CardHeader>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <CardTitle className="text-3xl mb-2">Cotización #{quote.quote_number || quote.id}</CardTitle>
                                        <CardDescription>
                                            Creada el {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getStatusColor(quote.status)} text-base px-4 py-1`}>
                                        {getStatusLabel(quote.status)}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                                        <p className="font-medium">{quote.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Correo Electrónico</p>
                                        <p className="font-medium">{quote.customer_email}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Última Actualización</p>
                                        <p className="font-medium">{format(new Date(quote.updated_at), "d 'de' MMMM, yyyy", { locale: es })}</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Products */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Productos Solicitados</h3>
                                <div className="space-y-4">
                                    {quote.items.map((item, index) => (
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

                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{item.product?.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{item.product?.description}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                                        <span>
                                                            Cantidad: <span className="font-medium">{item.quantity}</span> {item.product?.unit}s
                                                        </span>
                                                        <span>
                                                            Precio: <span className="font-medium">${item.unit_price.toFixed(2)}</span> /{" "}
                                                            {item.product?.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4" />

                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total Estimado:</span>
                                    <span className="text-2xl font-bold text-primary">${quote.total_amount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            {quote.customer_notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Notas del Cliente</h3>
                                        <p className="text-muted-foreground">{quote.customer_notes}</p>
                                    </div>
                                </>
                            )}

                            {/* Admin Response */}
                            {quote.admin_response && (
                                <>
                                    <Separator />
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2">Respuesta del Equipo</h3>
                                        <p>{quote.admin_response}</p>
                                    </div>
                                </>
                            )}

                            {/* Status Info */}
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    {quote.status === "pending" &&
                                        "Tu cotización está siendo revisada por nuestro equipo. Te contactaremos pronto."}
                                    {quote.status === "reviewed" &&
                                        "Tu cotización ha sido revisada. Nos pondremos en contacto contigo para confirmar detalles."}
                                    {quote.status === "approved" &&
                                        "¡Tu cotización ha sido aprobada! Nos pondremos en contacto contigo para proceder con el pedido."}
                                    {quote.status === "rejected" &&
                                        "Lamentablemente no podemos procesar esta cotización en este momento."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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
