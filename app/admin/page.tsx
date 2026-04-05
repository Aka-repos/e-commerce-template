"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, FileText, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import { getAllProducts } from "@/app/actions/products"
import { getAllQuotes } from "@/app/actions/quotes"
import { type Product } from "@/lib/products"
import { type Quote } from "@/lib/quotes"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesData, productsData] = await Promise.all([
          getAllQuotes(),
          getAllProducts()
        ])
        setAllQuotes(quotesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const pendingQuotes = allQuotes.filter((q) => q.status === "pending")
  const approvedQuotes = allQuotes.filter((q) => q.status === "approved")
  const rejectedQuotes = allQuotes.filter((q) => q.status === "rejected")

  const totalRevenue = approvedQuotes.reduce((sum, q) => sum + q.total_amount, 0)
  const lowStockProducts = products.filter((p) => p.stock_quantity < 50)

  const stats = [
    {
      title: "Total Productos",
      value: products.length,
      icon: Package,
      description: `${lowStockProducts.length} con stock bajo`,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Cotizaciones Totales",
      value: allQuotes.length,
      icon: FileText,
      description: `${pendingQuotes.length} pendientes`,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Cotizaciones Aprobadas",
      value: approvedQuotes.length,
      icon: CheckCircle,
      description: "Este mes",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Ingresos Estimados",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: "De cotizaciones aprobadas",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
  ]

  const recentQuotes = allQuotes.slice(0, 5)

  return (
    <AdminLayout currentPage="dashboard">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visión general del sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-md`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cotizaciones Recientes</CardTitle>
                  <CardDescription>Últimas solicitudes recibidas</CardDescription>
                </div>
                <Link href="/admin/cotizaciones">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay cotizaciones aún</p>
              ) : (
                <div className="space-y-4">
                  {recentQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">Cotización #{quote.quote_number}</p>
                          <Badge
                            variant="secondary"
                            className={
                              quote.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-700"
                                : quote.status === "approved"
                                  ? "bg-green-500/10 text-green-700"
                                  : quote.status === "rejected"
                                    ? "bg-red-500/10 text-red-700"
                                    : "bg-blue-500/10 text-blue-700"
                            }
                          >
                            {quote.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {quote.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {quote.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                            {quote.status === "pending"
                              ? "Pendiente"
                              : quote.status === "approved"
                                ? "Aprobada"
                                : quote.status === "rejected"
                                  ? "Rechazada"
                                  : "En Revisión"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{quote.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{quote.items.length} productos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${quote.total_amount.toFixed(2)}</p>
                        <Link href={`/admin/cotizacion/${quote.id}`}>
                          <Button variant="ghost" size="sm" className="mt-1">
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alertas de Stock</CardTitle>
                  <CardDescription>Productos con stock bajo (&lt; 50)</CardDescription>
                </div>
                <Link href="/admin/productos">
                  <Button variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Todos los productos tienen stock suficiente
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Categoría: {product.category_id}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            product.stock_quantity < 20 ? "bg-red-500/10 text-red-700" : "bg-yellow-500/10 text-yellow-700"
                          }
                        >
                          {product.stock_quantity} {product.unit}s
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quote Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cotizaciones</CardTitle>
            <CardDescription>Distribución de cotizaciones por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold">{pendingQuotes.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{allQuotes.filter((q) => q.status === "reviewed").length}</p>
                <p className="text-sm text-muted-foreground">En Revisión</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{approvedQuotes.length}</p>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold">{rejectedQuotes.length}</p>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
