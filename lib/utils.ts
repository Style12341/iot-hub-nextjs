import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, timezone: string = "America/Argentina/Buenos_Aires"): string {
  //Add Z if neccesary
  if (typeof date === "string" && !date.includes("Z")) {
    date += "Z";
  }
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone
  });
}