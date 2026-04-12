"use client"

import { useState, useEffect } from "react"
import { getCategories } from "@/app/actions/products"
import { type Category } from "@/lib/products"
import { Button } from "@/components/ui/button"

interface CategoryNavProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onSelectCategory(null)}
        className="whitespace-nowrap"
      >
        Todos los Productos
      </Button>

      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onSelectCategory(category.id)}
          className="whitespace-nowrap"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
