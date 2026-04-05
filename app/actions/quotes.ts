'use server'

import { query } from '@/lib/db'
import { Quote, QuoteItem, QuoteStatus } from '@/lib/quotes'

// Helper to construct Quote object with items
// Note: DB returns flat rows for joins usually, or we do 2 queries.
// For simplicity, we'll fetch quote then items.

export async function getAllQuotes(): Promise<Quote[]> {
    try {
        // We join with users to get customer info
        const { rows: quotes } = await query(`
      SELECT q.*, u.name as customer_name, u.email as customer_email
      FROM quotes q
      LEFT JOIN auth.users u ON q.customer_id = u.id
      ORDER BY q.created_at DESC
    `)

        // For list view, we might not need all items details, but let's fetch them efficiently if needed.
        // Or just fetch count. The UI shows items summary.
        // Let's do a loop for now or a group by (complex).
        // Simpler: iterate and fetch items. (N+1, but optimization later).

        const quotesWithItems = await Promise.all(quotes.map(async (q) => {
            const { rows: items } = await query(`
        SELECT qi.*, p.name as product_name, p.unit as product_unit, p.primary_image as product_image
        FROM quote_items qi
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE quote_id = $1
      `, [q.id])

            // Map item product info for UI
            const mappedItems = items.map(i => ({
                ...i,
                product: {
                    name: i.product_name,
                    unit: i.product_unit,
                    primary_image: i.product_image
                }
            }))

            return { ...q, items: mappedItems }
        }))

        return quotesWithItems as Quote[]
    } catch (error) {
        console.error('Error fetching quotes:', error)
        return []
    }
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
    try {
        const { rows: quotes } = await query(`
      SELECT q.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM quotes q
      LEFT JOIN auth.users u ON q.customer_id = u.id
      WHERE q.id = $1
    `, [id])

        if (quotes.length === 0) return undefined
        const q = quotes[0]

        const { rows: items } = await query(`
        SELECT qi.*, p.name as product_name, p.unit as product_unit, p.primary_image as product_image, p.description as product_description, p.base_price as product_base_price
        FROM quote_items qi
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE quote_id = $1
      `, [q.id])

        const mappedItems = items.map(i => ({
            ...i,
            product: {
                id: i.product_id,
                name: i.product_name,
                unit: i.product_unit,
                primary_image: i.product_image,
                description: i.product_description,
                base_price: i.product_base_price
            }
        }))

        return { ...q, items: mappedItems } as Quote
    } catch (error) {
        console.error('Error fetching quote:', error)
        return undefined
    }
}

export async function getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    try {
        const { rows: quotes } = await query(`
      SELECT q.*, u.name as customer_name, u.email as customer_email
      FROM quotes q
      LEFT JOIN auth.users u ON q.customer_id = u.id
      WHERE q.customer_id = $1
      ORDER BY q.created_at DESC
    `, [customerId])

        const quotesWithItems = await Promise.all(quotes.map(async (q) => {
            const { rows: items } = await query(`
        SELECT qi.*, p.name as product_name, p.unit as product_unit
        FROM quote_items qi
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE quote_id = $1
      `, [q.id])

            const mappedItems = items.map(i => ({
                ...i,
                product: {
                    name: i.product_name,
                    unit: i.product_unit,
                }
            }))

            return { ...q, items: mappedItems }
        }))

        return quotesWithItems as Quote[]
    } catch (error) {
        console.error('Error fetching customer quotes:', error)
        return []
    }
}

export async function updateQuoteStatus(id: string, status: QuoteStatus, adminResponse?: string): Promise<Quote | null> {
    try {
        const { rows } = await query(
            `UPDATE quotes 
       SET status = $1, admin_response = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
            [status, adminResponse, id]
        )
        return rows[0] as Quote
    } catch (error) {
        console.error('Error updating quote status:', error)
        return null
    }
}

export async function createQuote(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'quote_number'>): Promise<Quote | null> {
    try {
        const { customer_id, total_amount, customer_notes, items } = quote

        // Insert Quote
        // Note: status defaults to 'pending' in Schema? No, we set it.
        const { rows: qRows } = await query(
            `INSERT INTO quotes (customer_id, total_amount, customer_notes, status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING *`,
            [customer_id, total_amount, customer_notes]
        )
        const newQuote = qRows[0]

        // Insert Items
        for (const item of items) {
            await query(
                `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
                [newQuote.id, item.product_id, item.quantity, item.unit_price, item.subtotal]
            )
        }

        return newQuote as Quote
    } catch (error) {
        console.error('Error creating quote:', error)
        return null
    }
}
