"use client";

import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/constants/navigation";
import { useActivePath } from "@/hooks/use-active-path";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = useActivePath(href);
  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      {isActive && (
        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-accent" />
      )}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="ww-container flex h-[72px] items-center justify-between gap-8">
        <Link
          href="/"
          className="shrink-0 font-heading text-xl font-bold tracking-tight text-foreground transition-colors hover:text-foreground/80"
        >
          Walk-Way
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>


        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
            <MapPin className="h-3.5 w-3.5" />
            москва
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          
          <ThemeToggle />

          <Link
            href="/auth/login"
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:border-foreground/40 hover:bg-foreground/5"
          >
            Войти
          </Link>

          <Link
            href="/auth/register"
            className="rounded-full bg-ww-ink px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-ww-ink/80"
          >
            Зарегистрироваться
          </Link>
        </div>

        <button className="p-2 text-muted-foreground hover:text-foreground md:hidden">
          <span className="sr-only">Открыть меню</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
