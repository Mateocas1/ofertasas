'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function PromotionsPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  
  const { data: promotions, isLoading, isError } = useQuery({
    queryKey: ['promotions', selectedStore, selectedType],
    queryFn: () => apiGet<any>(`/api/promotions?store=${selectedStore}&type=${selectedType}`)
  })
  
  // Mock data for store filters
  const stores = ['Carrefour', 'Jumbo', 'Disco']
  const promotionTypes = ['2x1', 'Porcentaje', 'Billetera']
  
  if (isError) {
    return <div className="text-center p-8">Error al cargar las promociones</div>
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Promociones</h1>
      
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Filtrar por Supermercado</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStore === null ? "default" : "outline"}
              onClick={() => setSelectedStore(null)}
            >
              Todos
            </Button>
            {stores.map((store) => (
              <Button
                key={store}
                variant={selectedStore === store ? "default" : "outline"}
                onClick={() => setSelectedStore(store)}
              >
                {store}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Filtrar por Tipo</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              onClick={() => setSelectedType(null)}
            >
              Todos
            </Button>
            {promotionTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-video mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          promotions?.map((promotion: any) => (
            <Card key={promotion.id}>
              <CardContent className="p-4">
                <div className="aspect-video bg-gray-200 mb-2 flex items-center justify-center">
                  {promotion.product?.imageUrl ? (
                    <img 
                      src={promotion.product.imageUrl} 
                      alt={promotion.product.name} 
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-500">Sin imagen</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {promotion.product?.name || 'Producto desconocido'}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {promotion.supermarket?.name || 'Supermercado desconocido'}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {promotion.type || promotion.description}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}