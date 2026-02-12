import { describe, it, expect } from "vitest";
import { getRecommendedCategories } from "@/lib/catalog";

describe("Catalog recommendation logic", () => {
  it("returns default categories when no occasion is set", () => {
    const cats = getRecommendedCategories(null);
    expect(cats).toHaveLength(3);
    expect(cats).toContain("Coffee & Tea");
  });

  it("returns birthday-specific categories", () => {
    const cats = getRecommendedCategories("Birthday");
    expect(cats).toContain("Coffee & Tea");
    expect(cats).toContain("Food Delivery");
    expect(cats).toContain("Streaming");
  });

  it("returns congratulations-specific categories", () => {
    const cats = getRecommendedCategories("Congratulations");
    expect(cats).toContain("Books & Media");
    expect(cats).toContain("Generic Gift Cards");
  });

  it("returns holiday-specific categories", () => {
    const cats = getRecommendedCategories("Holiday");
    expect(cats).toContain("Gaming");
  });

  it("handles case-insensitive occasion matching", () => {
    const cats = getRecommendedCategories("birthday");
    expect(cats).toContain("Streaming");
  });

  it("returns default for unknown occasion", () => {
    const cats = getRecommendedCategories("Unknown Event");
    expect(cats).toHaveLength(3);
    expect(cats).toContain("Coffee & Tea");
  });
});
