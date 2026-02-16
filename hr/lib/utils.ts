import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a placeholder image URL or fallback color if image URL is null
 * @param imageUrl - The image URL to check
 * @param initials - Initials for avatar fallback (e.g., "JS" for John Smith)
 * @returns Placeholder image URL or null for avatar to use fallback
 */
export function getImageUrl(
  imageUrl: string | null,
  initials?: string
): string | null {
  if (imageUrl) {
    return imageUrl;
  }
  // Return null to let UI components handle the fallback with Avatar
  return null;
}

/**
 * Format currency value with proper locale
 * @param value - The numeric value to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Format date string to readable format
 * @param dateString - ISO 8601 date string or formatted date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateString;
  }
}
