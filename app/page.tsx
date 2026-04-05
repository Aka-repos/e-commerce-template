import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Users, FileText, Sparkles, Truck, Shield } from "lucide-react"
import { HeroSlider } from "@/components/home/hero-slider"
import { Footer } from "@/components/layout/footer"
import { getFeaturedProducts } from "@/app/actions/products"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const featuredProducts = (await getFeaturedProducts()).slice(0, 3)

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Ecommerce Name</h1>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/registro">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">¿Por qué elegirnos?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Ofrecemos la mejor experiencia en productos de sedería con calidad garantizada
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <ShoppingBag className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Catálogo Amplio</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Descubre nuestra variedad de telas, hilos, botones y accesorios de alta calidad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Cotizaciones Rápidas</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Solicita cotizaciones personalizadas y recibe respuesta inmediata de nuestro equipo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Atención Personalizada</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nuestro equipo está listo para ayudarte con tus proyectos y necesidades
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Calidad Premium</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Productos seleccionados cuidadosamente para garantizar la mejor calidad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <Truck className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Envío Rápido</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Procesamos y enviamos tus pedidos de manera ágil y segura
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Compra Segura</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Tu información y transacciones están completamente protegidas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Productos Destacados</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Explora nuestra selección especial de productos premium
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover-lift">
                <div className="relative aspect-square overflow-hidden bg-muted image-zoom">
                  <Image src={product.primary_image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  <Badge className="absolute top-4 right-4 bg-primary">Destacado</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription className="text-base">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">${product.base_price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                  </div>
                  <Link href={`/producto/${product.id}`}>
                    <Button className="w-full">Ver Detalles</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/catalogo">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Ver Todo el Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
          </div>
          <CardContent className="relative py-16 text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-balance">¿Listo para comenzar?</h3>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto text-pretty leading-relaxed">
              Crea tu cuenta gratis y empieza a explorar nuestros productos. Solicita cotizaciones y recibe atención
              personalizada.
            </p>
            <div className="flex gap-4 justify-center flex-wrap pt-4">
              <Link href="/registro">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link href="/catalogo">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                >
                  Explorar Catálogo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  )
}
