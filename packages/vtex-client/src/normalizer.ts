import type {
  VtexProduct,
  VtexItem,
  VtexSeller,
  VtexTeaser,
  NormalizedProduct,
  NormalizedPromotion,
} from "./types.js";

/**
 * Extracts the EAN from a VTEX item.
 * Falls back to referenceId if ean is missing.
 */
function extractEan(item: VtexItem): string | null {
  if (item.ean && item.ean.trim() !== "" && item.ean !== "SEM GTIN") {
    return item.ean.trim();
  }
  // Fallback: check referenceId
  const ref = item.referenceId?.find(
    (r) => r.Key === "RefId" || r.Key === "ean"
  );
  if (ref?.Value) return ref.Value.trim();
  return null;
}

/**
 * Parses a VTEX teaser into our normalized promotion format.
 */
function parseTeaser(teaser: VtexTeaser): NormalizedPromotion {
  const name = teaser.name.toLowerCase();

  let type: NormalizedPromotion["type"] = "other";
  let discountValue: number | null = null;
  let walletProvider: string | null = null;

  // Determine type from teaser name
  if (name.includes("2x1") || name.includes("lleva 2 paga 1")) {
    type = "2x1";
    discountValue = 50; // 50% off effective
  } else if (name.includes("2do al 50") || name.includes("segundo al 50")) {
    type = "2do_al_50";
    discountValue = 25; // 25% off effective (2 items)
  } else if (name.includes("%")) {
    type = "percentage";
    const match = name.match(/(\d+)\s*%/);
    if (match) discountValue = parseFloat(match[1]);
  } else if (
    name.includes("mercado pago") ||
    name.includes("uala") ||
    name.includes("naranja") ||
    name.includes("mastercard") ||
    name.includes("visa") ||
    name.includes("billetera")
  ) {
    type = "wallet";
    // Extract wallet provider
    const providers = [
      "mercado pago",
      "uala",
      "naranja",
      "mastercard",
      "visa",
      "maestro",
      "cabal",
      "amex",
    ];
    walletProvider =
      providers.find((p) => name.includes(p)) ?? teaser.name;
    const match = name.match(/(\d+)\s*%/);
    if (match) discountValue = parseFloat(match[1]);
  }

  return {
    type,
    description: teaser.name,
    discountValue,
    walletProvider,
    conditions: teaser.conditions
      ? {
          minimumQuantity: teaser.conditions.minimumQuantity,
          parameters: teaser.conditions.parameters,
        }
      : null,
  };
}

/**
 * Normalizes a raw VTEX product into our internal format.
 * Returns null if the product is invalid (missing EAN, images, etc).
 */
export function normalizeProduct(
  rawProduct: VtexProduct,
  baseUrl: string,
  source: string
): NormalizedProduct | null {
  // Must have items
  if (!rawProduct.items || rawProduct.items.length === 0) {
    return null;
  }

  const item = rawProduct.items[0];

  // Must have images
  if (!item.images || item.images.length === 0) {
    return null;
  }

  // Must have valid price range
  if (!rawProduct.priceRange?.sellingPrice) {
    return null;
  }

  // Must have EAN
  const ean = extractEan(item);
  if (!ean) {
    return null;
  }

  // Get the default seller or first seller
  const seller: VtexSeller | undefined =
    item.sellers?.find((s) => s.sellerDefault) || item.sellers?.[0];

  // Prices from seller's commertialOffer (most accurate)
  let sellingPrice = 0;
  let listPrice = 0;

  if (seller?.commertialOffer) {
    sellingPrice = seller.commertialOffer.Price;
    listPrice =
      seller.commertialOffer.PriceWithoutDiscount || sellingPrice;
  } else {
    // Fallback to priceRange
    sellingPrice = rawProduct.priceRange.sellingPrice.lowPrice;
    listPrice =
      rawProduct.priceRange.listPrice?.lowPrice || sellingPrice;
  }

  // Reference price (price per unit)
  let referencePrice: number | null = null;
  const referenceUnit = item.measurementUnit || null;

  if (item.unitMultiplier && item.unitMultiplier > 0 && sellingPrice > 0) {
    referencePrice = sellingPrice / item.unitMultiplier;
  }

  // Availability
  let isAvailable = true;
  if (seller?.commertialOffer) {
    isAvailable = seller.commertialOffer.AvailableQuantity > 0;
  }

  // Images
  const images = item.images.map((img) => img.imageUrl);

  // Promotions from teasers
  const promotions: NormalizedPromotion[] = [];
  if (seller?.commertialOffer?.teasers) {
    for (const teaser of seller.commertialOffer.teasers) {
      const promo = parseTeaser(teaser);
      promotions.push(promo);
    }
  }

  return {
    ean,
    externalId: rawProduct.productId,
    source,
    name: rawProduct.productName,
    link: `${baseUrl}/${rawProduct.linkText}/p`,
    image: images[0],
    images,

    price: sellingPrice,
    listPrice,
    referencePrice,
    referenceUnit,

    isAvailable,

    skuId: item.itemId || null,
    sellerId: seller?.sellerId || null,
    sellerName: seller?.sellerName || null,

    brand: rawProduct.brand || "",
    categories: rawProduct.categories || [],
    description: rawProduct.description || "",

    promotions,

    measurementUnit: item.measurementUnit || null,
    unitMultiplier: item.unitMultiplier || null,
  };
}
