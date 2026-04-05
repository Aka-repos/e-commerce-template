"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { type Category, type Product } from "@/lib/products"
import { getCategories } from "@/app/actions/products"
import { ImageUpload } from "@/components/admin/image-upload"

interface ProductFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (product: Omit<Product, "id"> | Product) => Promise<void>
  product?: Product | null
  mode: "add" | "edit"
}

export function ProductFormDialog({ open, onClose, onSubmit, product, mode }: ProductFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])
  // Allow strings for numeric fields to support easier editing (e.g. typing decimals)
  type ProductFormState = Omit<Product, "id" | "slug" | "created_at" | "updated_at" | "base_price" | "stock_quantity" | "min_stock_alert"> & {
    base_price: string | number
    stock_quantity: string | number
    min_stock_alert: string | number
  }

  const [formData, setFormData] = useState<ProductFormState>({
    name: "",
    cod_ref: "",
    description: "",
    category_id: "",
    base_price: "",
    unit: "metro",
    primary_image: "",
    stock_quantity: "",
    min_stock_alert: 10,
    is_featured: false,
    is_active: true,
    product_availability: "in_stock"
  })

  useEffect(() => {
    if (!open) return
    if (product && mode === "edit") {
      setFormData({
        name: product.name,
        cod_ref: product.cod_ref,
        description: product.description || "",
        category_id: product.category_id,
        base_price: product.base_price,
        unit: product.unit,
        primary_image: product.primary_image || "",
        stock_quantity: product.stock_quantity,
        min_stock_alert: product.min_stock_alert,
        is_featured: product.is_featured,
        is_active: product.is_active,
        product_availability: product.product_availability
      })
    } else if (mode === "add") {
      setFormData({
        name: "",
        cod_ref: "",
        description: "",
        category_id: categories[0]?.id ?? "",
        base_price: 0,
        unit: "metro",
        primary_image: "",
        stock_quantity: 0,
        min_stock_alert: 10,
        is_featured: false,
        is_active: true,
        product_availability: "in_stock"
      })
    }
  }, [product, mode, open, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submissionData = {
      ...formData,
      base_price: Number(formData.base_price) || 0,
      stock_quantity: Number(formData.stock_quantity) || 0,
      min_stock_alert: Number(formData.min_stock_alert) || 0,
    }

    if (mode === "edit" && product) {
      await onSubmit({ ...product, ...submissionData } as Product)
    } else {
      await onSubmit({
        ...submissionData,
        created_at: new Date(),
        updated_at: new Date()
      } as Omit<Product, "id">)
    }

    onClose()
  }

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Agregar Nuevo Producto" : "Editar Producto"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Completa la información del nuevo producto" : "Actualiza la información del producto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej: Tela de Algodón Premium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cod_ref">Código Ref. *</Label>
                <Input
                  id="cod_ref"
                  value={formData.cod_ref}
                  onChange={(e) => handleChange("cod_ref", e.target.value)}
                  placeholder="Ej: TEL-001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe las características del producto"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleChange("category_id", value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unidad de Medida *</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="carrete">Carrete</SelectItem>
                    <SelectItem value="pack 12">Pack 12</SelectItem>
                    <SelectItem value="pack 18">Pack 18</SelectItem>
                    <SelectItem value="pack 20">Pack 20</SelectItem>
                    <SelectItem value="pack 24">Pack 24</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio Base *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => handleChange("base_price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Disponible *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => handleChange("stock_quantity", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">Alerta Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock_alert}
                  onChange={(e) => handleChange("min_stock_alert", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <ImageUpload
                onUpload={(url) => handleChange("primary_image", url)}
                currentImage={formData.primary_image}
              />
              <p className="text-xs text-muted-foreground mt-1">Soporta: drag & drop múltiples formatos</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleChange("is_featured", checked)}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Marcar como producto destacado
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Producto Activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "add" ? "Agregar Producto" : "Guardar Cambios"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
