'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { ArrowLeft, TrendingDown, TrendingUp, TrendingUpDown, Gift } from 'lucide-react'
import PriceHistoryChart from '@/components/price-history-chart'

export default function ProductDetailPage() {
  const params = useParams()
  const ean = params.ean as string
  const { addItem } = useCartStore()

  // Fetch current product details
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', ean],
    queryFn: async () => {
      const response = await apiGet<any>(`/api/products/${ean}`)
      return response
    }
  })
  
  // Extracted from product.data
  const priceHistory = product?.priceHistory

  // Fetch price history
  const { data: priceHistory, isLoading: isPriceHistoryLoading } = useQuery({
    queryKey: ['priceHistory', ean],
    queryFn: async () => {
      const response = await apiGet<any>(`/api/price-history/${ean}`)
      return response
    },
    enabled: !!ean
  })

  if (isProductLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
        <p className="text-text-secondary mb-6">El producto que buscas no está disponible</p>
        <Link href="/">
          <Button className="bg-brand-accent hover:bg-blue-700">
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  // Normalize prices
  const getPricesArray = () => {
    if (!product.prices) return [];
    if (Array.isArray(product.prices)) return product.prices;
    return Object.entries(product.prices).map(([storeName, priceInfo]: any) => ({
      supermarketId: storeName,
      sellingPrice: priceInfo.sellingPrice ?? priceInfo.price,
      listPrice: priceInfo.listPrice,
      referencePrice: priceInfo.referencePrice,
      isAvailable: priceInfo.isAvailable,
    }));
  }

  const pricesArray = getPricesArray();
  
  // Find cheapest
  let cheapestStore = "";
  let cheapestPrice = Infinity;
  for (const price of pricesArray) {
    const currentPrice = price.sellingPrice ?? 0;
    if (currentPrice && currentPrice < cheapestPrice) {
      cheapestPrice = currentPrice;
      cheapestStore = price.supermarketId;
    }
  }

  // Calculate savings
  const maxPrice = Math.max(...pricesArray.map((p: any) => p.sellingPrice || 0));
  const savings = maxPrice - cheapestPrice;
  const savingsPercent = Math.round((savings / maxPrice) * 100);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-surface border-b border-border">
        <div className="container mx-auto py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-lg font-semibold flex-1 truncate">{product.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Product Image & Basic Info */}
          <div className="md:col-span-1">
            <div className="bg-surface border border-border rounded-xl p-8 mb-6">
              <div className="relative aspect-square mb-6">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              
              {product.brand && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Marca
                  </p>
                  <p className="text-lg font-semibold text-text-primary">{product.brand}</p>
                </div>
              )}

              {product.ean && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    EAN
                  </p>
                  <p className="font-mono text-sm text-text-secondary">{product.ean}</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Comparison & CTA */}
          <div className="md:col-span-2">
            {/* Savings Banner */}
            {savings > 0 && (
              <div className="bg-green-50 border border-brand-success rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <TrendingDown className="w-6 h-6 text-brand-success flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-brand-success mb-1">Ahorro disponible</p>
                    <p className="text-3xl font-bold text-brand-success mb-1">
                      ${savings.toFixed(0)} ({savingsPercent}%)
                    </p>
                    <p className="text-sm text-text-secondary">
                      Comprando en {cheapestStore.charAt(0).toUpperCase() + cheapestStore.slice(1)} en lugar del más caro
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Comparison Grid */}
            <div className="bg-surface border border-border rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-6 text-text-primary">Precios en supermercados</h2>
              
              <div className="space-y-4">
                {pricesArray.map((price: any) => {
                  const isCheapest = cheapestStore === price.supermarketId;
                  const storeName = typeof price.supermarketId === 'string'
                    ? price.supermarketId.charAt(0).toUpperCase() + price.supermarketId.slice(1)
                    : price.supermarketId;

                  return (
                    <div
                      key={`${product.ean}-${price.supermarketId}`}
                      className={`rounded-lg border p-4 transition-all ${
                        isCheapest
                          ? 'bg-green-50 border-brand-success'
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-semibold mb-1 ${isCheapest ? 'text-brand-success' : 'text-text-primary'}`}>
                            {storeName}
                            {isCheapest && (
                              <span className="ml-2 text-xs font-bold bg-brand-success text-white px-2 py-1 rounded">
                                MÁS BARATO
                              </span>
                            )}
                          </p>
                          {price.listPrice && price.listPrice > (price.sellingPrice || 0) && (
                            <p className="text-sm text-text-tertiary line-through">
                              ${price.listPrice?.toFixed(0)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {price.sellingPrice !== null ? (
                            <p className="font-mono font-bold text-2xl text-text-primary">
                              ${price.sellingPrice?.toFixed(0)}
                            </p>
                          ) : (
                            <p className="text-sm text-text-tertiary">No disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promotions */}
            {product.promotions && product.promotions.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-lg font-semibold text-text-primary">Promociones activas</h2>
                </div>
                
                <div className="space-y-3">
                  {product.promotions.map((promo: any, idx: number) => (
                    <div
                      key={`promo-${idx}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                    >
                      <p className="font-semibold text-brand-accent mb-1">
                        {promo.discountValue ? `${promo.discountValue}%` : ''} {promo.description}
                      </p>
                      {promo.walletProvider && (
                        <p className="text-sm text-text-secondary">
                          Billetera: {promo.walletProvider}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

        {/* Add to Cart CTA */}
        <Button
          className="w-full h-12 text-lg bg-brand-accent hover:bg-blue-700 text-white font-semibold"
          onClick={() => {
            if (cheapestStore) {
              const selectedPrice = pricesArray.find((p: any) => p.supermarketId === cheapestStore);
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
          Comprar en {cheapestStore.charAt(0).toUpperCase() + cheapestStore.slice(1)}
        </Button>
      </div>
    </div>
  </div>

  {/* Price History Chart */}
  {priceHistory && (
    <PriceHistoryChart history={priceHistory} />
  )}
</div>
)
}
