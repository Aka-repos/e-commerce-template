"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ProductCard } from "@/components/catalog/product-card"
import { CategoryNav } from "@/components/catalog/category-nav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { getAllProducts, getProductsByCategory, searchProducts, getFeaturedProducts } from "@/app/actions/products"
import { type Product } from "@/lib/products"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Footer } from "@/components/layout/footer"

export default function CatalogoPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [displayProducts, setDisplayProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load cart count and featured products
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("quoteCart") || "[]")
      setCartCount(cart.length)
    }

    getFeaturedProducts().then(setFeaturedProducts).catch(console.error)
  }, [])

  // Filter products based on category and search
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        let filtered: Product[] = []

        if (searchQuery) {
          // If searching, search first
          filtered = await searchProducts(searchQuery)
          if (selectedCategory) {
            filtered = filtered.filter(p => p.category_id === selectedCategory)
          }
        } else if (selectedCategory) {
          filtered = await getProductsByCategory(selectedCategory)
        } else {
          filtered = await getAllProducts()
        }

        setDisplayProducts(filtered)
      } catch (error) {
        console.error("Failed to fetch products", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, searchQuery])

  const handleAddToQuote = (product: Product) => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("quoteCart") || "[]")
      const existingItem = cart.find((item: any) => item.product_id === product.id)

      if (existingItem) {
        existingItem.quantity += 1
        existingItem.subtotal = existingItem.quantity * existingItem.unit_price
      } else {
        cart.push({
          product_id: product.id,
          quantity: 1,
          unit_price: product.base_price,
          subtotal: product.base_price,
          product: product,
        })
      }

      localStorage.setItem("quoteCart", JSON.stringify(cart))
      setCartCount(cart.length)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartItemCount={cartCount} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/50 to-background border-b">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Catálogo de Productos</h1>
              <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
                Explora nuestra amplia selección de telas, hilos, botones y accesorios de alta calidad
              </p>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories and Products */}
        <section className="container mx-auto px-4 py-12">
          <div className="space-y-8">
            {/* Category Navigation */}
            <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
            {/* Products Grid */}
            {displayProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    {selectedCategory
                      ? `${displayProducts.length} productos encontrados`
                      : searchQuery
                        ? `${displayProducts.length} resultados para "${searchQuery}"`
                        : "Todos los Productos"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToQuote={handleAddToQuote} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">No se encontraron productos</p>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory(null)
                  }}
                  variant="outline"
                >
                  Ver Todos los Productos
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Featured Section */}
        {!searchQuery && !selectedCategory && featuredProducts.length > 0 && (
          <section className="bg-muted/30 border-t py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">Productos Destacados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToQuote={handleAddToQuote} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
