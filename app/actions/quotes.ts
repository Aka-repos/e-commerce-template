'use server'

import { supabaseAdmin as supabase } from '@/lib/db'
import { Quote, QuoteStatus } from '@/lib/quotes'

export async function getAllQuotes(): Promise<Quote[]> {
    const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
            *,
            customer:users(name, email)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching quotes:', error)
        return []
    }

    const quotesWithItems = await Promise.all((quotes ?? []).map(async (q) => {
        const { data: items } = await supabase
            .from('quote_items')
            .select(`*, product:products(name, unit, primary_image)`)
            .eq('quote_id', q.id)

        return { ...q, items: items ?? [] }
    }))

    return quotesWithItems as Quote[]
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
    const { data: q, error } = await supabase
        .from('quotes')
        .select(`*, customer:users(name, email, phone)`)
        .eq('id', id)
        .single()

    if (error || !q) {
        console.error('Error fetching quote:', error)
        return undefined
    }

    const { data: items } = await supabase
        .from('quote_items')
        .select(`*, product:products(id, name, unit, description, base_price, primary_image)`)
        .eq('quote_id', q.id)

    return { ...q, items: items ?? [] } as Quote
}

export async function getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`*, customer:users(name, email)`)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching customer quotes:', error)
        return []
    }

    const quotesWithItems = await Promise.all((quotes ?? []).map(async (q) => {
        const { data: items } = await supabase
            .from('quote_items')
            .select(`*, product:products(name, unit)`)
            .eq('quote_id', q.id)

        return { ...q, items: items ?? [] }
    }))

    return quotesWithItems as Quote[]
}

export async function updateQuoteStatus(id: string, status: QuoteStatus, adminResponse?: string): Promise<Quote | null> {
    const { data, error } = await supabase
        .from('quotes')
        .update({ status, admin_response: adminResponse })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating quote status:', error)
        return null
    }
    return data as Quote
}

export async function createQuote(
    quote: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'quote_number'>
): Promise<Quote | null> {
    const { customer_id, total_amount, customer_notes, items } = quote

    const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({ customer_id, total_amount, customer_notes, status: 'pending' })
        .select()
        .single()

    if (quoteError || !newQuote) {
        console.error('Error creating quote:', quoteError)
        return null
    }

    const quoteItems = items.map(item => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
    }))

    const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems)

    if (itemsError) {
        console.error('Error creating quote items:', itemsError)
    }

    return newQuote as Quote
}
