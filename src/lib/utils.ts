import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tool Rental utilities
export function calculateTotalPrice(dailyRate: number, startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (isNaN(start) || isNaN(end)) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((end - start) / msPerDay) + 1 - 1);
  return Math.max(0, Number(dailyRate) * days);
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  return !isNaN(start) && !isNaN(end) && end >= start;
}