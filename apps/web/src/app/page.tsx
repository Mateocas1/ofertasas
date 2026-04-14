import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { ProductCard, ProductCardSkeleton } from '@/components/search/product-card'
import { apiGet } from '@/lib/api'
import { Product } from '@/types/api'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  const { data: searchResults, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const response = await apiGet<any>(`/api/search?q=${debouncedQuery}`);
      return response.products || [];
    },
    enabled: debouncedQuery.length > 0
  })
  
  if (isError) {
    return <div className="text-center p-8">Error al cargar los productos</div>
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-8">Buscador de Precios</h1>
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mx-auto"
        />
      </div>
      
      <div className="mb-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : debouncedQuery.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl mb-2">Bienvenido al buscador de precios</h2>
            <p className="text-gray-600">Buscá productos para comparar precios</p>
          </div>
        ) : !searchResults || searchResults.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl mb-2">Sin resultados</h2>
            <p className="text-gray-600">Buscá productos para comparar precios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((product: Product) => (
              <ProductCard key={product.ean} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}