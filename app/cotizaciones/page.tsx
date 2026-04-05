"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
import { getQuotesByCustomer } from "@/app/actions/quotes"
import { getStatusLabel, getStatusColor, type Quote } from "@/lib/quotes"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, Eye, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CotizacionesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    getQuotesByCustomer(user.id)
      .then(setQuotes)
      .catch(console.error)

    // Check if coming from new quote
    const newQuoteId = searchParams.get("new")
    if (newQuoteId) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [user, router, searchParams])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mis Cotizaciones</h1>
            <p className="text-muted-foreground">Gestiona y revisa el estado de tus solicitudes de cotización</p>
          </div>

          {showSuccess && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                ¡Cotización enviada exitosamente! Nuestro equipo la revisará pronto.
              </AlertDescription>
            </Alert>
          )}

          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No tienes cotizaciones</h2>
                <p className="text-muted-foreground mb-6">Explora nuestro catálogo y solicita tu primera cotización</p>
                <Link href="/catalogo">
                  <Button size="lg">Explorar Catálogo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Cotización #{quote.id}
                          <Badge className={getStatusColor(quote.status)}>{getStatusLabel(quote.status)}</Badge>
                        </CardTitle>
                        <CardDescription>
                          Creada el {format(quote.created_at, "d 'de' MMMM, yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <Link href={`/cotizacion/${quote.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Productos solicitados:</p>
                      <div className="space-y-1">
                        {quote.items.slice(0, 3).map((item, index) => (
                          <p key={index} className="text-sm">
                            • {item.product?.name} - {item.quantity} {item.product?.unit}s
                          </p>
                        ))}
                        {quote.items.length > 3 && (
                          <p className="text-sm text-muted-foreground">+ {quote.items.length - 3} productos más</p>
                        )}
                      </div>
                    </div>

                    {quote.customer_notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">Notas:</p>
                          <p className="text-sm text-muted-foreground">{quote.customer_notes}</p>
                        </div>
                      </>
                    )}

                    {quote.admin_response && (
                      <>
                        <Separator />
                        <div className="bg-muted/50 p-4 rounded-md">
                          <p className="text-sm font-medium mb-1">Respuesta del equipo:</p>
                          <p className="text-sm">{quote.admin_response}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Estimado:</span>
                      <span className="text-xl font-bold text-primary">${quote.total_amount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
