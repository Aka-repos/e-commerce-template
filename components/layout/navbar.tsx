"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react"
import { getCurrentUser, logout } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface NavbarProps {
  cartItemCount?: number
}

export function Navbar({ cartItemCount = 0 }: NavbarProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
    router.push("/")
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background/80 backdrop-blur-sm"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user ? "/catalogo" : "/"} className="flex items-center group">
            <h1 className="text-xl md:text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
              Ecommerce Name
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {user && (
              <>
                <Link href="/catalogo">
                  <Button variant="ghost" className="hover:bg-accent">
                    Catálogo
                  </Button>
                </Link>
                <Link href="/cotizaciones">
                  <Button variant="ghost" className="hover:bg-accent">
                    Mis Cotizaciones
                  </Button>
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" className="hover:bg-accent">
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Cart - Added animated badge */}
                {(user.role === "minorista" || user.role === "mayorista") && (
                  <Link href="/carrito">
                    <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-zoom-in">
                          {cartItemCount}
                        </Badge>
                      )}
                      <span className="sr-only">Carrito de cotizaciones</span>
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Menú de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-accent"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:inline-block">
                  <Button variant="ghost" className="hover:bg-accent">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu - Enhanced mobile menu with animation */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t animate-slide-up">
            <nav className="flex flex-col gap-2">
              <Link href="/catalogo" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                  Catálogo
                </Button>
              </Link>
              <Link href="/cotizaciones" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                  Mis Cotizaciones
                </Button>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                    Admin
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
