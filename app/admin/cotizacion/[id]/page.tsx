import { getQuoteById } from "@/app/actions/quotes"
import { AdminQuoteDetail } from "@/components/admin/quote-detail"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const quote = await getQuoteById(resolvedParams.id)

  if (!quote) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Cotización no encontrada</h1>
            <Link href="/admin/cotizaciones">
              <Button>Volver a Cotizaciones</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return <AdminQuoteDetail quote={quote} />
}
