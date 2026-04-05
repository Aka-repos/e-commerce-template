'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { uploadProductImage } from '@/app/actions/upload'
import Image from 'next/image'
import { toast } from 'sonner' // Assuming sonner is used, or alert

interface ImageUploadProps {
    onUpload: (url: string) => void
    currentImage?: string
    disabled?: boolean
}

export function ImageUpload({ onUpload, currentImage, disabled = false }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        // Reset state
        setError(null)
        setIsUploading(true)
        setProgress(0) // Determining progress in Server Action is hard without WebSocket, we'll simulate or just show indeterminate.

        // Create local preview
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        // Simulate progress start
        setProgress(10)

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simulate progress info
            const interval = setInterval(() => {
                setProgress((prev) => (prev < 90 ? prev + 10 : prev))
            }, 500)

            const result = await uploadProductImage(formData)

            clearInterval(interval)
            setProgress(100)

            if (result.error) {
                throw new Error(result.error)
            }

            if (result.url) {
                onUpload(result.url)
                toast.success("Imagen subida exitosamente")
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Error al subir imagen")
            setPreview(currentImage || null) // Revert preview
            toast.error("Error al subir imagen")
        } finally {
            setIsUploading(false)
        }
    }, [onUpload, currentImage])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        multiple: false,
        disabled: disabled || isUploading
    })

    // Clear image
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview(null)
        onUpload("")
    }

    return (
        <div className="space-y-4 w-full">
            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px] text-center
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
        `}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
                        <div className="relative w-full max-w-[250px] aspect-square rounded-md overflow-hidden bg-muted">
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-contain"
                                // Use unoptimized for local object URLs to avoid Next.js error
                                unoptimized={preview.startsWith('blob:')}
                            />
                        </div>

                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 m-2 h-8 w-8 rounded-full"
                            onClick={handleRemove}
                            disabled={disabled || isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {isUploading && (
                            <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <span className="text-sm font-medium">Subiendo...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-muted rounded-full">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                {isDragActive ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, WEBP (max 50MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isUploading && (
                <Progress value={progress} className="h-2 w-full transition-all" />
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
