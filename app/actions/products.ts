'use server'

import { query } from '@/lib/db'
import { Product } from '@/lib/products'

export async function getAllProducts(): Promise<Product[]> {
    try {
        const { rows } = await query('SELECT * FROM products ORDER BY created_at DESC')
        return rows as Product[]
    } catch (error) {
        console.error('Error fetching products:', error)
        return []
    }
}

export async function getProductById(id: string): Promise<Product | undefined> {
    try {
        const { rows } = await query('SELECT * FROM products WHERE id = $1', [id])
        return rows[0] as Product
    } catch (error) {
        console.error('Error fetching product:', error)
        return undefined
    }
}

export async function getFeaturedProducts(): Promise<Product[]> {
    try {
        const { rows } = await query('SELECT * FROM products WHERE is_featured = true LIMIT 4')
        return rows as Product[]
    } catch (error) {
        console.error('Error fetching featured products:', error)
        return []
    }
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
        const { rows } = await query('SELECT * FROM products WHERE category_id = $1', [categoryId])
        return rows as Product[]
    } catch (error) {
        console.error('Error fetching products by category:', error)
        return []
    }
}

export async function searchProducts(term: string): Promise<Product[]> {
    try {
        const searchTerm = `%${term}%`
        const { rows } = await query(
            'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 OR category_id ILIKE $1',
            [searchTerm]
        )
        return rows as Product[]
    } catch (error) {
        console.error('Error searching products:', error)
        return []
    }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    const {
        name, description, category_id, base_price, unit,
        stock_quantity, min_stock_alert, is_active, is_featured, product_availability,
        primary_image, cod_ref
    } = product

    try {
        const { rows } = await query(
            `INSERT INTO products (
        name, description, category_id, base_price, unit, 
        stock_quantity, min_stock_alert, is_active, is_featured, product_availability,
        primary_image, cod_ref
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                name, description, category_id, base_price, unit,
                stock_quantity, min_stock_alert, is_active, is_featured, product_availability,
                primary_image, cod_ref
            ]
        )
        return rows[0] as Product
    } catch (error) {
        console.error('Error creating product:', error)
        return null
    }
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    const fields = Object.keys(product).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
    if (fields.length === 0) return null

    const values = fields.map(k => (product as any)[k])
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')

    try {
        const { rows } = await query(
            `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        return rows[0] as Product
    } catch (error) {
        console.error('Error updating product:', error)
        return null
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    try {
        await query('DELETE FROM products WHERE id = $1', [id])
        return true
    } catch (error) {
        console.error('Error deleting product:', error)
        return false
    }
}
