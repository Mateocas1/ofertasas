import { Suspense } from "react";
import { apiGet } from "@/lib/api";
import { notFound } from "next/navigation";
import type { Product } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/stores/cart";

interface ProductPageProps {
  params: Promise<{ ean: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { ean } = await params;

  try {
    const product = await apiGet<Product>(`/api/products/${ean}`);

    if (!product) {
      notFound();
    }

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
          {/* Product Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="w-full md:w-1/3">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-gray-500 mb-4">{product.brand}</p>
              )}
              {product.category && (
                <Badge variant="outline" className="mb-4">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Price Comparison */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Comparación de Precios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.prices.map((price) => {
                const isCheapest =
                  product.prices
                    .filter((p) => p.isAvailable)
                    .sort(
                      (a, b) =>
                        (a.sellingPrice ?? Infinity) -
                        (b.sellingPrice ?? Infinity)
                    )[0]?.supermarketId === price.supermarketId;

                return (
                  <div
                    key={price.supermarketId}
                    className={`border rounded-lg p-4 ${
                      isCheapest
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">
                        {price.supermarket.name}
                      </h3>
                      {isCheapest && (
                        <Badge variant="default" className="bg-green-600">
                          Más barato
                        </Badge>
                      )}
                    </div>

                    {price.isAvailable ? (
                      <>
                        <div className="text-2xl font-bold">
                          ${price.sellingPrice?.toLocaleString("es-AR")}
                        </div>
                        {price.listPrice &&
                          price.listPrice > (price.sellingPrice ?? 0) && (
                            <div className="text-sm text-gray-500 line-through">
                              ${price.listPrice.toLocaleString("es-AR")}
                            </div>
                          )}
                        {price.referencePrice && (
                          <div className="text-sm text-gray-600 mt-1">
                            ${price.referencePrice.toLocaleString("es-AR")}
                            /unidad
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500 py-2">No disponible</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price History Placeholder */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Historial de Precios
            </h2>
            <div className="border rounded-lg p-8 text-center text-gray-500">
              Gráfico de historial de precios — próximamente con Recharts
            </div>
          </div>

          {/* Promotions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Promociones</h2>
            {product.promotions.length > 0 ? (
              <div className="space-y-3">
                {product.promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="border rounded-lg p-4 bg-blue-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge>{promo.type}</Badge>
                      <span className="font-semibold">
                        {promo.description}
                      </span>
                    </div>
                    {promo.walletProvider && (
                      <p className="text-sm text-gray-600 mt-1">
                        Con {promo.walletProvider}
                      </p>
                    )}
                    {promo.discountValue && (
                      <p className="text-sm text-gray-600">
                        {promo.discountValue}% de descuento
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No hay promociones activas para este producto.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
