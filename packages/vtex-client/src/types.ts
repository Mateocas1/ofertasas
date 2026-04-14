// ============================================
// VTEX Raw Response Types
// ============================================

export interface VtexImage {
  imageId: string;
  imageUrl: string;
  imageLabel: string | null;
  imageTag: string;
  imageText: string;
}

export interface VtexCommertialOffer {
  Price: number;
  ListPrice: number;
  PriceWithoutDiscount: number;
  AvailableQuantity: number;
  discountHighlights: Array<{ name: string }>;
  teasers: Array<VtexTeaser>;
  giftSkuIds: string[];
  BuyTogether: unknown[];
  ItemMetadataAttachment: unknown[];
}

export interface VtexTeaser {
  name: string;
  conditions: {
    minimumQuantity: number;
    parameters: Array<{ name: string; value: string }>;
  };
  effects: {
    parameters: Array<{ name: string; value: string }>;
  };
}

export interface VtexSeller {
  sellerId: string;
  sellerName: string;
  sellerDefault: boolean;
  commertialOffer: VtexCommertialOffer;
}

export interface VtexItem {
  itemId: string;
  name: string;
  nameComplete: string;
  complementName: string;
  ean: string;
  images: VtexImage[];
  sellers: VtexSeller[];
  measurementUnit: string;
  unitMultiplier: number;
  referenceId: Array<{ Key: string; Value: string }>;
}

export interface VtexProduct {
  productId: string;
  productName: string;
  brand: string;
  brandId: string;
  linkText: string;
  categories: string[];
  description: string;
  items: VtexItem[];
  priceRange: {
    sellingPrice: { lowPrice: number; highPrice: number };
    listPrice: { lowPrice: number; highPrice: number };
  };
  productOriginVtex: boolean;
}

export interface VtexProductSuggestionsResponse {
  data: {
    productSuggestions: {
      products: VtexProduct[];
      count: number;
    };
  };
  errors?: Array<{ message: string }>;
}

// ============================================
// Normalized Types (our internal format)
// ============================================

export interface NormalizedPromotion {
  type: "percentage" | "2x1" | "2do_al_50" | "wallet" | "fixed" | "other";
  description: string;
  discountValue: number | null;
  walletProvider: string | null;
  conditions: Record<string, unknown> | null;
}

export interface NormalizedProduct {
  ean: string;
  externalId: string;
  source: string;
  name: string;
  link: string;
  image: string;
  images: string[];

  price: number;           // sellingPrice
  listPrice: number;       // original price (before discount)
  referencePrice: number | null;  // price per unit
  referenceUnit: string | null;   // "un", "kg", "lt"

  isAvailable: boolean;

  skuId: string | null;
  sellerId: string | null;
  sellerName: string | null;

  brand: string;
  categories: string[];
  description: string;

  promotions: NormalizedPromotion[];

  measurementUnit: string | null;
  unitMultiplier: number | null;
}

export interface VtexQueryParams {
  workspace: string;
  maxAge: string;
  appsEtag: string;
  domain: string;
  locale: string;
  operationName: string;
  variables: string;
  extensions: string;
}

// ============================================
// Hash Manager Types
// ============================================

export interface HashRecord {
  hash: string;
  discoveredAt: Date;
  expiresAt: Date;
}

// ============================================
// Search Types
// ============================================

export interface SearchOptions {
  query: string;
  stores: string[];
  count?: number;
}

export interface StoreResult {
  store: string;
  products: NormalizedProduct[];
  success: boolean;
  error?: string;
  responseTime: number;
}

export interface SearchResponse {
  query: string;
  results: StoreResult[];
  totalProducts: number;
  cached: boolean;
  responseTime: number;
}
