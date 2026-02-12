import { CatalogItem } from "@prisma/client";
import { prisma } from "./db";

export interface CatalogFilterOptions {
  maxCents: number;
  minCents?: number;
  category?: string;
}

/**
 * Fetch catalog items filtered by budget constraints.
 * Items are sorted by popularity (desc) then price (asc).
 */
export async function getFilteredCatalog(options: CatalogFilterOptions): Promise<
  (CatalogItem & { isBestMatch: boolean })[]
> {
  const items = await prisma.catalogItem.findMany({
    where: {
      active: true,
      priceCents: { lte: options.maxCents },
      ...(options.category ? { category: options.category } : {}),
    },
    orderBy: [{ popularity: "desc" }, { priceCents: "asc" }],
  });

  return items.map((item) => ({
    ...item,
    isBestMatch: options.minCents ? item.priceCents >= options.minCents : true,
  }));
}

/**
 * Get recommended items based on occasion.
 */
export function getRecommendedCategories(occasion?: string | null): string[] {
  const occasionMap: Record<string, string[]> = {
    birthday: ["Coffee & Tea", "Food Delivery", "Streaming"],
    congratulations: ["Coffee & Tea", "Books & Media", "Generic Gift Cards"],
    "thank you": ["Coffee & Tea", "Food Delivery", "Generic Gift Cards"],
    holiday: ["Gaming", "Streaming", "Generic Gift Cards"],
    "just because": ["Coffee & Tea", "Books & Media", "Food Delivery"],
    wedding: ["Food Delivery", "Generic Gift Cards", "Books & Media"],
    graduation: ["Books & Media", "Generic Gift Cards", "Coffee & Tea"],
  };

  const key = occasion?.toLowerCase() ?? "";
  return occasionMap[key] ?? ["Coffee & Tea", "Generic Gift Cards", "Food Delivery"];
}
