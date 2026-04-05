'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// Initialize S3 Client
// Ensure these env vars are set in your .env or platform configuration
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
    region: process.env.S3_REGION || process.env.SUPABASE_REGION || 'us-east-1',
    credentials: {
        accessKeyId: (process.env.S3_ACCESS_KEY || process.env.SUPABASE_ACCESS_KEY_ID)!,
        secretAccessKey: (process.env.S3_SECRET_KEY || process.env.SUPABASE_SECRET_ACCESS_KEY)!
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' // Required for MinIO
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'producto-imagen'

export async function uploadProductImage(formData: FormData): Promise<{ url: string | null; error?: string }> {
    try {
        const file = formData.get('file') as File
        if (!file) {
            return { url: null, error: 'No file provided' }
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `productos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` // Sanitize filename

        // For images > 50MB, use multipart upload (Upload class)
        // Note: Next.js Server Actions pass the file, but we convert to buffer.
        // For extremely large files, streaming directly might be better but Server Actions abstraction makes it tricky.
        // Given the context of "products", >50MB is rare, but we support it via logic.

        // Check if we have basic credentials (either custom or supabase)
        const hasCredentials = (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) ||
            (process.env.SUPABASE_ACCESS_KEY_ID && process.env.SUPABASE_SECRET_ACCESS_KEY)

        if (!hasCredentials) {
            console.error("Missing S3 credentials")
            return { url: null, error: 'Server configuration error: Missing credentials' }
        }

        if (file.size > 50 * 1024 * 1024) {
            // Large file upload
            const parallelUploads3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: BUCKET_NAME,
                    Key: filename,
                    Body: buffer,
                    ContentType: file.type,
                },
            })

            await parallelUploads3.done()
        } else {
            // Single put upload
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: filename,
                Body: buffer,
                ContentType: file.type,
            })

            await s3Client.send(command)
        }

        // Construct public URL
        // If NEXT_PUBLIC_STORAGE_URL is defined, use it. Otherwise fallback to Supabase default format.
        const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public`

        // Ensure baseUrl doesn't have trailing slash and path doesn't have leading slash duplication if handled
        const publicUrl = `${baseUrl}/${BUCKET_NAME}/${filename}`

        return { url: publicUrl }

    } catch (error: any) {
        console.error('S3 Upload Error:', error)
        return { url: null, error: error.message || 'Upload failed' }
    }
}
