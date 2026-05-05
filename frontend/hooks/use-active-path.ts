"use client";

import { usePathname } from "next/navigation";

export function useActivePath(href: string): boolean {
  const pathname = usePathname();
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
