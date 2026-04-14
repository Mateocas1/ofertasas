import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCartStore } from "@/stores/cart"
import { Product } from "@/types/api"
import Image from "next/image"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  
  // Convert the API response structure to what the component expects
  const convertProductStructure = () => {
    // The API returns prices as an object with store names as keys
    // Convert to array format expected by the component
    const priceArray: any[] = [];
    if (product.prices) {
      for (const [storeName, priceInfo] of Object.entries(product.prices)) {
        const p = priceInfo as any;
        priceArray.push({
          supermarket: { name: storeName },
          sellingPrice: p.sellingPrice ?? p.price,
          listPrice: p.listPrice,
          referencePrice: p.referencePrice,
          isAvailable: p.isAvailable,
          supermarketId: storeName
        });
      }
    }
    
    // Find the cheapest store
    let cheapestStore = "";
    let cheapestPrice = Infinity;
    for (const [storeName, priceInfo] of Object.entries(product.prices || {})) {
      const p = priceInfo as any;
      const price = p.sellingPrice ?? p.price;
      if (price && price < cheapestPrice) {
        cheapestPrice = price;
        cheapestStore = storeName;
      }
    }
    
    return {
      ...product,
      prices: priceArray,
      cheapestStore
    };
  }
  
  const convertedProduct = convertProductStructure();
  const cheapestStore = convertedProduct.cheapestStore;
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="relative aspect-square mb-2">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
        )}
        
        <div className="grid grid-cols-3 gap-1 mb-2">
          {convertedProduct.prices.map((price) => {
            const isCheapest = cheapestStore === price.supermarketId
            return (
              <div 
                key={`${product.ean}-${price.supermarketId}`} 
                className={`p-1 rounded text-xs ${isCheapest ? 'bg-green-100 border border-green-300' : ''}`}
              >
                <div className="font-medium">{price.supermarket.name}</div>
                {price.sellingPrice !== null ? (
                  <>
                    <div className="font-semibold">
                      ${price.sellingPrice?.toFixed(2)}
                    </div>
                    {price.listPrice && price.listPrice > (price.sellingPrice || 0) && (
                      <div className="text-xs text-gray-500 line-through">
                        ${price.listPrice?.toFixed(2)}
                      </div>
                    )}
                    {price.referencePrice && (
                      <div className="text-xs text-gray-500">
                        ${price.referencePrice?.toFixed(2)}/u
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500">No disponible</div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {product.promotions?.map((promo: any) => (
            <Badge key={promo.id} variant="secondary" className="text-xs">
              {promo.description}
            </Badge>
          ))}
        </div>
        
        <Button 
          className="w-full text-xs" 
          size="sm"
          onClick={() => {
            // Add to cart from the cheapest available store by default
            if (cheapestStore && (product.prices as any)?.[cheapestStore]) {
              addItem({
                productId: product.ean,
                productName: product.name,
                productImage: product.image ?? product.imageUrl ?? '',
                supermarketId: cheapestStore,
                supermarketName: cheapestStore,
                price: (product.prices as any)[cheapestStore]?.sellingPrice ?? (product.prices as any)[cheapestStore]?.price ?? 0,
                quantity: 1
              })
            }
          }}
        >
          Agregar al carrito
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <Skeleton className="aspect-square w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-2" />
        <div className="grid grid-cols-3 gap-1 mb-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <Button className="w-full" size="sm" disabled>
          Agregar al carrito
        </Button>
      </CardContent>
    </Card>
  )
}