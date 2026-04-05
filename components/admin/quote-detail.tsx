"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateQuoteStatus } from "@/app/actions/quotes" // Action
import { getStatusLabel, getStatusColor, type QuoteStatus, type Quote } from "@/lib/quotes"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AdminQuoteDetailProps {
    quote: Quote
}

export function AdminQuoteDetail({ quote: initialQuote }: AdminQuoteDetailProps) {
    const router = useRouter()
    const [quote, setQuote] = useState<Quote>(initialQuote)
    const [newStatus, setNewStatus] = useState<QuoteStatus>(quote.status)
    const [adminResponse, setAdminResponse] = useState(quote.admin_response || "")
    const [showSuccess, setShowSuccess] = useState(false)

    const handleUpdateQuote = async () => {
        const updatedQuote = await updateQuoteStatus(quote.id, newStatus, adminResponse)
        if (updatedQuote) {
            setQuote(updatedQuote)
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    }

    return (
        <AdminLayout currentPage="quotes">
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/admin/cotizaciones">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Cotizaciones
                        </Button>
                    </Link>
                </div>

                {showSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-300">
                            Cotización actualizada exitosamente
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quote Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
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

                                <Separator className="my-4" />

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

                                {/* Customer Notes */}
                                {quote.customer_notes && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Notas del Cliente</h3>
                                            <div className="bg-muted/50 p-4 rounded-lg">
                                                <p className="text-muted-foreground">{quote.customer_notes}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Admin Actions */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Gestionar Cotización</CardTitle>
                                <CardDescription>Actualiza el estado y responde al cliente</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Estado de la Cotización</Label>
                                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as QuoteStatus)}>
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendiente</SelectItem>
                                            <SelectItem value="reviewed">En Revisión</SelectItem>
                                            <SelectItem value="approved">Aprobada</SelectItem>
                                            <SelectItem value="rejected">Rechazada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="response">Respuesta al Cliente</Label>
                                    <Textarea
                                        id="response"
                                        placeholder="Escribe tu respuesta al cliente..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        rows={6}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Esta respuesta será visible para el cliente en su panel
                                    </p>
                                </div>

                                <Button onClick={handleUpdateQuote} className="w-full" size="lg">
                                    Guardar Cambios
                                </Button>

                                <Separator />

                                {/* Quick Actions */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Acciones Rápidas</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setNewStatus("approved")
                                                setAdminResponse(
                                                    "¡Excelente! Tu cotización ha sido aprobada. Nos pondremos en contacto contigo para proceder con el pedido.",
                                                )
                                            }}
                                            className="bg-transparent"
                                        >
                                            Aprobar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setNewStatus("rejected")
                                                setAdminResponse(
                                                    "Lamentablemente no podemos procesar esta cotización en este momento. Contáctanos para más detalles.",
                                                )
                                            }}
                                            className="bg-transparent"
                                        >
                                            Rechazar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout >
    )
}
