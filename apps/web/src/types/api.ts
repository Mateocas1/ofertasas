export interface Product {
  id: string;
  ean: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  measurementUnit: string;
  unitMultiplier: number;
  prices: Price[];
  promotions: Promotion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Price {
  id: string;
  productId: string;
  supermarketId: string;
  sellingPrice: number;
  listPrice: number;
  referencePrice: number;
  isAvailable: boolean;
  recordedAt: Date;
}

export interface Promotion {
  id: string;
  productId: string;
  supermarketId: string;
  type: string;
  description: string;
  conditions: any;
  discountValue: number;
  walletProvider: string;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  recordedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  supermarketId: string;
  price: number;
  quantity: number;
  addedAt: Date;
}

export interface SearchResult {
  ean: string;
  name: string;
  brand: string;
  imageUrl: string;
  prices: {
    supermarketId: string;
    sellingPrice: number;
    listPrice: number;
    referencePrice: number;
    isAvailable: boolean;
  }[];
  promotions: Promotion[];
}

export interface StoreResult {
  id: string;
  name: string;
  baseUrl: string;
  products: Product[];
  prices: Price[];
  promotions: Promotion[];
}