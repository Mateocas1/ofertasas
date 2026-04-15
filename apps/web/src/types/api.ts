export interface Product {
  id: string;
  ean: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  image?: string;
  measurementUnit: string;
  unitMultiplier: number;
  prices: Price[];
  promotions: Promotion[];
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: PriceHistory; // Add priceHistory property
}

export interface Price {
  id: string;
  productId: string;
  supermarketId: string;
  supermarket?: { id: string; name: string };
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
  addedAt: string | Date; // Harmonized runtime string vs compile-time Date
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

export interface PriceHistoryDataPoint {
  date: string;
  price: number;
}

export interface PriceHistoryStore {
  supermarketId: string;
  data: PriceHistoryDataPoint[];
}

export interface PriceHistorySummary {
  min: number | null;
  max: number | null;
  avg: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE';
  samples: number;
}

export interface PriceHistory {
  history: PriceHistoryStore[];
  summary: PriceHistorySummary;
}

export interface Store {
  id: string;
  name: string;
  baseUrl: string;
  products: Product[];
  prices: Price[];
  promotions: Promotion[];
}