/** Shared validation logic for gift creation */

export interface GiftFormData {
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  amountType: "FIXED" | "RANGE";
  amountFixed?: number; // in dollars
  amountMin?: number;   // in dollars
  amountMax?: number;   // in dollars
  occasion?: string;
  message: string;
  cardTemplateId: string;
  notifyRecipient: boolean;
  expirationDays: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 500;

export function validateGiftForm(data: GiftFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.senderName.trim()) {
    errors.push({ field: "senderName", message: "Sender name is required" });
  }
  if (!EMAIL_REGEX.test(data.senderEmail)) {
    errors.push({ field: "senderEmail", message: "Valid sender email is required" });
  }
  if (!data.recipientName.trim()) {
    errors.push({ field: "recipientName", message: "Recipient name is required" });
  }
  if (!EMAIL_REGEX.test(data.recipientEmail)) {
    errors.push({ field: "recipientEmail", message: "Valid recipient email is required" });
  }

  if (data.amountType === "FIXED") {
    if (!data.amountFixed || data.amountFixed < MIN_AMOUNT || data.amountFixed > MAX_AMOUNT) {
      errors.push({ field: "amountFixed", message: `Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}` });
    }
  } else {
    if (!data.amountMin || data.amountMin < MIN_AMOUNT) {
      errors.push({ field: "amountMin", message: `Minimum must be at least $${MIN_AMOUNT}` });
    }
    if (!data.amountMax || data.amountMax > MAX_AMOUNT) {
      errors.push({ field: "amountMax", message: `Maximum cannot exceed $${MAX_AMOUNT}` });
    }
    if (data.amountMin && data.amountMax && data.amountMin > data.amountMax) {
      errors.push({ field: "amountMin", message: "Minimum must be less than or equal to maximum" });
    }
  }

  if (!data.message.trim()) {
    errors.push({ field: "message", message: "A message is required" });
  }
  if (data.message.length > 500) {
    errors.push({ field: "message", message: "Message must be under 500 characters" });
  }
  if (!data.cardTemplateId) {
    errors.push({ field: "cardTemplateId", message: "Please select a card template" });
  }
  if (data.expirationDays < 1 || data.expirationDays > 90) {
    errors.push({ field: "expirationDays", message: "Expiration must be between 1 and 90 days" });
  }

  return errors;
}

export const OCCASIONS = [
  "Birthday",
  "Congratulations",
  "Thank You",
  "Holiday",
  "Just Because",
  "Wedding",
  "Graduation",
  "Get Well Soon",
  "Anniversary",
];
