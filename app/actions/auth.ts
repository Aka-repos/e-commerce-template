'use server'

import { supabaseAdmin } from '@/lib/db'
import type { User } from '@/lib/auth'

export async function getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, auth_id, email, name, phone, role, status, company_name, company_ruc, company_address, show_prices, created_at, updated_at')
        .eq('email', email)
        .single()

    if (error || !data) return null

    return data as User
}
