"use client"

import type React from "react"

import { categories } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Scissors, Circle } from "lucide-react"

interface CategoryNavProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  fabric: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  ),
  thread: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16" />
    </svg>
  ),
  circle: <Circle className="h-5 w-5" />,
  scissors: <Scissors className="h-5 w-5" />,
}

export function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
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
          <span className="mr-2">{categoryIcons[category.icon]}</span>
          {category.name}
        </Button>
      ))}
    </div>
  )
}
