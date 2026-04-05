import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Ecommerce Name</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu tienda de confianza en telas, hilos y accesorios de sedería. Calidad y servicio desde hace más de 20
              años.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalogo" className="text-muted-foreground hover:text-primary transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/cotizaciones" className="text-muted-foreground hover:text-primary transition-colors">
                  Mis Cotizaciones
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="text-muted-foreground hover:text-primary transition-colors">
                  Carrito
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-muted-foreground hover:text-primary transition-colors">
                  Crear Cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Categorías</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/catalogo?categoria=telas"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Telas
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo?categoria=hilos"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Hilos
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo?categoria=botones"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Botones
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo?categoria=accesorios"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Av. Principal 123, Ciudad, País</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">info@sederiadonchicho.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 Ecommerce Name. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-primary transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
