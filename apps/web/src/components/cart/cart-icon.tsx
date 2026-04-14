'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cart'
import { Button } from '@/components/ui/button'
import { CartDrawer } from '@/components/cart/cart-drawer'

export function CartIcon() {
  const { getItemCount } = useCartStore()
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const itemCount = getItemCount()
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsCartOpen(true)}
        className="relative"
      >
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
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
      
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  )
}