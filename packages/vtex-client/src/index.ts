// Types
export type {
  VtexProduct,
  VtexItem,
  VtexSeller,
  VtexCommertialOffer,
  VtexTeaser,
  VtexImage,
  VtexProductSuggestionsResponse,
  NormalizedProduct,
  NormalizedPromotion,
  HashRecord,
  SearchOptions,
  StoreResult,
  SearchResponse,
} from "./types.js";

// Client
export {
  VTEX_STORES,
  fetchVtexProducts,
  searchAcrossStores,
  setHash,
  getHash,
} from "./client.js";

// Normalizer
export { normalizeProduct } from "./normalizer.js";

// Hash Manager
export {
  saveHash,
  getHash as getManagedHash,
  isHashExpired,
  getAllHashes,
  removeHash,
  initHashManager,
} from "./hash-manager.js";

// Unit Calculator
export {
  calculateReferencePrice,
  extractUnitFromName,
  compareByReferencePrice,
  formatReferencePrice,
} from "./unit-calculator.js";
