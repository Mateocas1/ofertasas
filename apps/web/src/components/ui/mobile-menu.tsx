'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="md:hidden">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex flex-col gap-4 p-4">
            <a href="/" className="text-lg font-medium">Inicio</a>
            <a href="/promociones" className="text-lg font-medium">Promociones</a>
            <a href="/products" className="text-lg font-medium">Productos</a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}