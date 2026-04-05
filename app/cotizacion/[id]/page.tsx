import { getQuoteById } from "@/app/actions/quotes"
import { QuoteDetail } from "@/components/quotes/quote-detail"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const quote = await getQuoteById(resolvedParams.id)

  if (!quote) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Cotización no encontrada</h1>
            <Link href="/cotizaciones">
              <Button>Volver a Mis Cotizaciones</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return <QuoteDetail quote={quote} />
}
