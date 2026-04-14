"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, getItemsByStore, getGrandTotal, getItemCount } =
    useCartStore();
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const itemsByStore = getItemsByStore();
  const grandTotal = getGrandTotal();
  const storeEntries = Object.entries(itemsByStore);

  const handleRemove = (item: CartItem) => {
    // Save for undo
    setRemovedItem(item);
    removeItem(item.id);

    // Clear any existing timer
    if (undoTimer) clearTimeout(undoTimer);

    // Auto-clear undo after 5s
    const timer = setTimeout(() => {
      setRemovedItem(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndo = () => {
    if (!removedItem) return;
    // Re-add the item
    useCartStore.getState().addItem({
      productId: removedItem.productId,
      productName: removedItem.productName,
      productImage: removedItem.productImage,
      supermarketId: removedItem.supermarketId,
      supermarketName: removedItem.supermarketName,
      price: removedItem.price,
      quantity: removedItem.quantity,
    });
    setRemovedItem(null);
    if (undoTimer) clearTimeout(undoTimer);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Tu Carrito</DrawerTitle>
            <DrawerDescription>
              {getItemCount()} {getItemCount() === 1 ? "producto" : "productos"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto max-h-[50vh]">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                <DrawerClose asChild>
                  <Button variant="outline">Explorar productos</Button>
                </DrawerClose>
              </div>
            ) : (
              storeEntries.map(([storeId, storeItems]) => {
                const storeName = storeItems[0]?.supermarketName ?? storeId;
                const storeSubtotal = storeItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );

                return (
                  <div key={storeId} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-sm text-gray-700">
                        {storeName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Subtotal: ${storeSubtotal.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {storeItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-10 h-10 object-contain rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${item.price.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemove(item)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Undo toast */}
          {removedItem && (
            <div className="mx-4 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
              <span className="text-sm">Producto eliminado</span>
              <Button size="sm" variant="outline" onClick={handleUndo}>
                Deshacer
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <DrawerFooter>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold pt-2">
                <span>Total:</span>
                <span>${grandTotal.toLocaleString("es-AR")}</span>
              </div>
              {storeEntries.length > 1 && (
                <p className="text-xs text-gray-500 text-center">
                  Comprando en {storeEntries.length} supermercados
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Vaciar
                </Button>
                <Button className="flex-1">Ir a comprar</Button>
              </div>
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
