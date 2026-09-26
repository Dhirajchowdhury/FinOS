import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User } from "@/types/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "FinOS User";
  if (user.name && user.name.trim()) return user.name;
  if (user.email) {
    const handle = user.email.split("@")[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return "FinOS User";
}

export function getUserInitials(user: User | null | undefined): string {
  const name = getUserDisplayName(user);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
