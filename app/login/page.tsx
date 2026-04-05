import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">Ecommerce Name</h1>
          </Link>
          <p className="text-muted-foreground">Sistema de Cotizaciones</p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
