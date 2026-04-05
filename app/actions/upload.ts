'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF!
const BUCKET     = process.env.SUPABASE_STORAGE_BUCKET || 'producto-imagen'
const REGION     = process.env.SUPABASE_STORAGE_REGION || 'us-east-1'

const s3 = new S3Client({
    endpoint: `https://${PROJECT_REF}.supabase.co/storage/v1/s3`,
    region: REGION,
    credentials: {
        accessKeyId:     process.env.SUPABASE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // required for Supabase Storage S3
})

function buildFilename(originalName: string): string {
    const ext  = originalName.split('.').pop()?.toLowerCase() ?? 'jpg'
    const base = originalName
        .replace(/\.[^/.]+$/, '')           // remove extension
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')        // non-alphanumeric → dash
        .replace(/^-+|-+$/g, '')            // trim leading/trailing dashes
        .slice(0, 60)                        // cap length
    const ts = Date.now()
    return `productos/${base}-${ts}.${ext}`
}

export async function uploadProductImage(
    formData: FormData
): Promise<{ url: string | null; error?: string }> {
    if (!PROJECT_REF || !process.env.SUPABASE_S3_ACCESS_KEY_ID) {
        return { url: null, error: 'Supabase Storage no está configurado. Revisa las variables de entorno.' }
    }

    const file = formData.get('file') as File | null
    if (!file) return { url: null, error: 'No se recibió ningún archivo.' }

    const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_SIZE) {
        return { url: null, error: 'El archivo supera el límite de 50 MB.' }
    }

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) {
        return { url: null, error: 'Formato no soportado. Usa JPG, PNG, WEBP o GIF.' }
    }

    try {
        const buffer   = Buffer.from(await file.arrayBuffer())
        const key      = buildFilename(file.name)

        await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         key,
            Body:        buffer,
            ContentType: file.type,
        }))

        // Public URL: https://{ref}.supabase.co/storage/v1/object/public/{bucket}/{key}
        const url = `${process.env.NEXT_PUBLIC_STORAGE_URL}/${BUCKET}/${key}`
        return { url }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido al subir la imagen.'
        return { url: null, error: message }
    }
}
