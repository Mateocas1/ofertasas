/**
 * Unit Price Calculator
 *
 * Normalizes prices across different measurement units so products
 * of different sizes can be compared fairly.
 *
 * Example:
 *   "Leche 1L" at $800 → $800/litro
 *   "Leche 1.5L" at $1100 → $733/litro  ← better value
 */

// Base units for comparison
type BaseUnit = "lt" | "kg" | "un";

interface UnitConversion {
  baseUnit: BaseUnit;
  multiplier: number; // how many base units this represents
}

// Map VTEX measurement units to base units
const UNIT_MAP: Record<string, UnitConversion> = {
  // Volume
  lt: { baseUnit: "lt", multiplier: 1 },
  l: { baseUnit: "lt", multiplier: 1 },
  ml: { baseUnit: "lt", multiplier: 0.001 },
  cc: { baseUnit: "lt", multiplier: 0.001 },

  // Weight
  kg: { baseUnit: "kg", multiplier: 1 },
  gr: { baseUnit: "kg", multiplier: 0.001 },
  g: { baseUnit: "kg", multiplier: 0.001 },

  // Units
  un: { baseUnit: "un", multiplier: 1 },
  u: { baseUnit: "un", multiplier: 1 },
  par: { baseUnit: "un", multiplier: 1 },
};

/**
 * Calculates the reference price (price per base unit).
 *
 * @param sellingPrice - Current selling price
 * @param unitMultiplier - VTEX unitMultiplier (e.g., 1.5 for 1.5L)
 * @param measurementUnit - VTEX measurementUnit (e.g., "lt", "kg", "un")
 * @returns Object with referencePrice and referenceUnit, or null if can't calculate
 */
export function calculateReferencePrice(
  sellingPrice: number,
  unitMultiplier: number | null | undefined,
  measurementUnit: string | null | undefined
): { referencePrice: number; referenceUnit: BaseUnit } | null {
  if (
    !unitMultiplier ||
    unitMultiplier <= 0 ||
    !measurementUnit ||
    sellingPrice <= 0
  ) {
    return null;
  }

  const normalizedUnit = measurementUnit.toLowerCase().trim();
  const conversion = UNIT_MAP[normalizedUnit];

  if (!conversion) {
    return null;
  }

  // referencePrice = price / (unitMultiplier * conversion multiplier)
  // Example: $1500 for 1.5L → 1500 / (1.5 * 1) = $1000/lt
  const baseUnitQuantity = unitMultiplier * conversion.multiplier;
  const referencePrice = sellingPrice / baseUnitQuantity;

  return {
    referencePrice: Math.round(referencePrice * 100) / 100,
    referenceUnit: conversion.baseUnit,
  };
}

/**
 * Tries to extract unit info from a product name using regex.
 * Used as fallback when VTEX doesn't provide unitMultiplier.
 *
 * Examples:
 *   "Leche La Serenísima 1L" → { value: 1, unit: "lt" }
 *   "Arroz Gallo 1kg" → { value: 1, unit: "kg" }
 *   "Aceite Natura 900ml" → { value: 0.9, unit: "lt" }
 *   "Fideos Matarazzo 500gr" → { value: 0.5, unit: "kg" }
 */
export function extractUnitFromName(
  productName: string
): { value: number; unit: BaseUnit } | null {
  const patterns = [
    // "1.5L", "1,5L", "900ml", "500cc"
    /(\d+(?:[.,]\d+)?)\s*(lt?|ml|cc)\b/i,
    // "1kg", "500gr", "250g"
    /(\d+(?:[.,]\d+)?)\s*(kg|gr?|g)\b/i,
  ];

  for (const pattern of patterns) {
    const match = productName.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(",", "."));
      const rawUnit = match[2].toLowerCase();
      const conversion = UNIT_MAP[rawUnit];

      if (conversion) {
        return {
          value: value * conversion.multiplier,
          unit: conversion.baseUnit,
        };
      }
    }
  }

  return null;
}

/**
 * Compares two products by their reference price.
 * Returns negative if a is cheaper, positive if b is cheaper, 0 if equal.
 * Only comparable if they share the same base unit.
 */
export function compareByReferencePrice(
  aPrice: number,
  aUnit: BaseUnit | null,
  bPrice: number,
  bUnit: BaseUnit | null
): number | null {
  if (!aUnit || !bUnit || aUnit !== bUnit) {
    return null; // Not comparable
  }
  return aPrice - bPrice;
}

/**
 * Returns a human-readable label for a reference price.
 */
export function formatReferencePrice(
  referencePrice: number,
  referenceUnit: BaseUnit
): string {
  const unitLabels: Record<BaseUnit, string> = {
    lt: "/litro",
    kg: "/kg",
    un: "/unidad",
  };
  return `$${referencePrice.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}${unitLabels[referenceUnit]}`;
}
