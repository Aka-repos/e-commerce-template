'use server'

import { supabaseAdmin as supabase } from '@/lib/db'
import { Product, Category } from '@/lib/products'

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }
    return data as Category[]
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('v_products_complete')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }
    return data as Product[]
}

export async function getProductById(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
        .from('v_products_complete')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching product:', error)
        return undefined
    }
    return data as Product
}

export async function getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('v_products_complete')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(4)

    if (error) {
        console.error('Error fetching featured products:', error)
        return []
    }
    return data as Product[]
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('v_products_complete')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching products by category:', error)
        return []
    }
    return data as Product[]
}

export async function searchProducts(term: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('v_products_complete')
        .select('*')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,cod_ref.ilike.%${term}%`)
        .eq('is_active', true)

    if (error) {
        console.error('Error searching products:', error)
        return []
    }
    return data as Product[]
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createProduct(
    product: Omit<Product, 'id' | 'slug' | 'created_at' | 'updated_at'>
): Promise<Product | null> {
    const {
        name, description, category_id, base_price, unit,
        stock_quantity, min_stock_alert, is_active, is_featured,
        product_availability, cod_ref,
        primary_image,
    } = product

    // 1. Insert the product
    const { data: created, error: productError } = await supabase
        .from('products')
        .insert({
            name, description, category_id, base_price, unit,
            stock_quantity, min_stock_alert, is_active, is_featured,
            product_availability, cod_ref,
        })
        .select()
        .single()

    if (productError || !created) {
        console.error('Error creating product:', productError)
        return null
    }

    // 2. Insert image into product_images if provided
    if (primary_image) {
        const { error: imageError } = await supabase
            .from('product_images')
            .insert({
                product_id: created.id,
                image_url: primary_image,
                is_primary: true,
                display_order: 0,
            })

        if (imageError) {
            console.error('Error inserting product image:', imageError)
        }
    }

    // 3. Return via view so primary_image is populated
    return (await getProductById(created.id)) ?? null
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    const { primary_image, slug, created_at, updated_at, id: _id, ...productFields } = product

    if (Object.keys(productFields).length > 0) {
        const { error } = await supabase
            .from('products')
            .update(productFields)
            .eq('id', id)

        if (error) {
            console.error('Error updating product:', error)
            return null
        }
    }

    // Upsert primary image
    if (primary_image !== undefined) {
        if (primary_image) {
            await supabase
                .from('product_images')
                .upsert(
                    { product_id: id, image_url: primary_image, is_primary: true, display_order: 0 },
                    { onConflict: 'product_id,display_order' }
                )
        } else {
            await supabase
                .from('product_images')
                .delete()
                .eq('product_id', id)
                .eq('is_primary', true)
        }
    }

    return (await getProductById(id)) ?? null
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting product:', error)
        return false
    }
    return true
}
