import { describe, it, expect } from "vitest";
import { validateGiftForm, GiftFormData } from "@/lib/validation";

function makeValidForm(overrides: Partial<GiftFormData> = {}): GiftFormData {
  return {
    senderName: "Alice",
    senderEmail: "alice@example.com",
    recipientName: "Bob",
    recipientEmail: "bob@example.com",
    recipientPhone: "",
    amountType: "FIXED",
    amountFixed: 50,
    amountMin: 30,
    amountMax: 75,
    occasion: "Birthday",
    message: "Happy birthday!",
    cardTemplateId: "classic",
    notifyRecipient: true,
    expirationDays: 30,
    ...overrides,
  };
}

describe("Gift form validation", () => {
  it("passes with valid fixed-amount form", () => {
    const errors = validateGiftForm(makeValidForm());
    expect(errors).toHaveLength(0);
  });

  it("passes with valid range form", () => {
    const errors = validateGiftForm(
      makeValidForm({ amountType: "RANGE", amountMin: 20, amountMax: 100 })
    );
    expect(errors).toHaveLength(0);
  });

  it("fails when sender name is empty", () => {
    const errors = validateGiftForm(makeValidForm({ senderName: "" }));
    expect(errors.find((e) => e.field === "senderName")).toBeDefined();
  });

  it("fails with invalid sender email", () => {
    const errors = validateGiftForm(makeValidForm({ senderEmail: "not-an-email" }));
    expect(errors.find((e) => e.field === "senderEmail")).toBeDefined();
  });

  it("fails when fixed amount is below $10", () => {
    const errors = validateGiftForm(makeValidForm({ amountFixed: 5 }));
    expect(errors.find((e) => e.field === "amountFixed")).toBeDefined();
  });

  it("fails when fixed amount exceeds $500", () => {
    const errors = validateGiftForm(makeValidForm({ amountFixed: 600 }));
    expect(errors.find((e) => e.field === "amountFixed")).toBeDefined();
  });

  it("fails when range min > max", () => {
    const errors = validateGiftForm(
      makeValidForm({ amountType: "RANGE", amountMin: 100, amountMax: 50 })
    );
    expect(errors.find((e) => e.field === "amountMin")).toBeDefined();
  });

  it("fails when range min is below $10", () => {
    const errors = validateGiftForm(
      makeValidForm({ amountType: "RANGE", amountMin: 5, amountMax: 100 })
    );
    expect(errors.find((e) => e.field === "amountMin")).toBeDefined();
  });

  it("fails when range max exceeds $500", () => {
    const errors = validateGiftForm(
      makeValidForm({ amountType: "RANGE", amountMin: 10, amountMax: 600 })
    );
    expect(errors.find((e) => e.field === "amountMax")).toBeDefined();
  });

  it("fails when message is empty", () => {
    const errors = validateGiftForm(makeValidForm({ message: "" }));
    expect(errors.find((e) => e.field === "message")).toBeDefined();
  });

  it("fails when message exceeds 500 characters", () => {
    const errors = validateGiftForm(makeValidForm({ message: "x".repeat(501) }));
    expect(errors.find((e) => e.field === "message")).toBeDefined();
  });

  it("fails when expiration is out of range", () => {
    const errors = validateGiftForm(makeValidForm({ expirationDays: 0 }));
    expect(errors.find((e) => e.field === "expirationDays")).toBeDefined();
  });

  it("fails when recipient email is invalid", () => {
    const errors = validateGiftForm(makeValidForm({ recipientEmail: "invalid" }));
    expect(errors.find((e) => e.field === "recipientEmail")).toBeDefined();
  });
});
