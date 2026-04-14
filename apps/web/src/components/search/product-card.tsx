import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCartStore } from "@/stores/cart"
import { Product } from "@/types/api"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  
  // Normalize prices to array format (API might return object or array)
  const getPricesArray = () => {
    if (!product.prices) return [];
    
    if (Array.isArray(product.prices)) {
      return product.prices;
    }
    
    return Object.entries(product.prices).map(([storeName, priceInfo]: any) => ({
      supermarketId: storeName,
      sellingPrice: priceInfo.sellingPrice ?? priceInfo.price,
      listPrice: priceInfo.listPrice,
      referencePrice: priceInfo.referencePrice,
      isAvailable: priceInfo.isAvailable,
    }));
  };
  
  const pricesArray = getPricesArray();
  
  // Find the cheapest store
  let cheapestStore = "";
  let cheapestPrice = Infinity;
  for (const price of pricesArray) {
    const currentPrice = price.sellingPrice ?? 0;
    if (currentPrice && currentPrice < cheapestPrice) {
      cheapestPrice = currentPrice;
      cheapestStore = price.supermarketId;
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:shadow-md">
      {/* Product Image */}
      <div className="relative aspect-square bg-background overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary">
            <span className="text-sm">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Product Title & Brand */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 text-text-primary leading-tight mb-1">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-text-tertiary">{product.brand}</p>
          )}
        </div>

        {/* Price Comparison - Clean 3-column layout */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Precios</p>
          <div className="grid grid-cols-3 gap-2">
            {pricesArray.map((price) => {
              const isCheapest = cheapestStore === price.supermarketId;
              const storeName = typeof price.supermarketId === 'string' 
                ? price.supermarketId.charAt(0).toUpperCase() + price.supermarketId.slice(1)
                : price.supermarketId;
              
              return (
                <div
                  key={`${product.ean}-${price.supermarketId}`}
                  className={`rounded-lg border p-2.5 text-center transition-colors ${
                    isCheapest
                      ? 'bg-green-50 border-brand-success'
                      : 'bg-background border-border hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-xs font-medium ${isCheapest ? 'text-brand-success' : 'text-text-tertiary'}`}>
                    {storeName}
                  </div>
                  {price.sellingPrice !== null ? (
                    <>
                      <div className="font-mono font-semibold text-sm text-text-primary mt-1">
                        ${price.sellingPrice?.toFixed(0)}
                      </div>
                      {price.listPrice && price.listPrice > (price.sellingPrice || 0) && (
                        <div className="text-xs text-text-tertiary line-through mt-0.5">
                          ${price.listPrice?.toFixed(0)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-text-tertiary mt-1">No disponible</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Promotions */}
        {product.promotions && product.promotions.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Promociones</p>
            <div className="flex flex-wrap gap-2">
              {product.promotions.map((promo: any, idx: number) => (
                <span
                  key={`${product.ean}-promo-${idx}`}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-brand-accent font-medium text-xs"
                >
                  {promo.discountValue ? `${promo.discountValue}%` : ''} {promo.description}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 border-t border-border pt-3">
          <Link
            href={`/productos/${product.ean}`}
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full text-sm h-9"
            >
              Detalles
            </Button>
          </Link>
          <Button
            className="flex-1 text-sm h-9 bg-brand-accent hover:bg-blue-700"
            onClick={() => {
              if (cheapestStore) {
                const selectedPrice = pricesArray.find(p => p.supermarketId === cheapestStore);
                if (selectedPrice) {
                  addItem({
                    productId: product.ean,
                    productName: product.name,
                    productImage: product.image ?? product.imageUrl ?? '',
                    supermarketId: cheapestStore,
                    supermarketName: cheapestStore,
                    price: selectedPrice.sellingPrice ?? 0,
                    quantity: 1
                  })
                }
              }
            }}
          >
            Comprar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}
