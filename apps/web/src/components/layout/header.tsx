'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CartIcon } from '@/components/cart/cart-icon'
import { MobileMenu } from '@/components/ui/mobile-menu'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery)}`
    }
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            oferTASAS
          </Link>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:flex">
          <Input
            type="search"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </form>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden md:inline-flex" onClick={() => window.location.href = '/promociones'}>
            Promociones
          </Button>
          <CartIcon />
          <MobileMenu />
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="md:hidden p-4">
        <form onSubmit={handleSearch} className="flex">
          <Input
            type="search"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </form>
      </div>
    </header>
  )
}