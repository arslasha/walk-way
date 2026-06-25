"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MapPin, ChevronDown, User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/constants/navigation";
import { useActivePath } from "@/hooks/use-active-path";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = useActivePath(href);
  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-all hover:text-foreground active:scale-95",
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
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success("Вы вышли из системы");
    router.push("/");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-all",
      isMobileMenuOpen && "z-[150]"
    )}>
      <div className="ww-container flex h-[72px] items-center justify-between gap-8">
        <Link
          href="/"
          className="shrink-0 font-heading text-xl font-bold tracking-tight text-foreground transition-all hover:text-foreground/80 active:scale-95"
        >
          Walk-Way
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          {isAuthenticated && (
            <NavLink href="/profile" label="Профиль" />
          )}
        </nav>


        <div className="hidden items-center gap-3 md:flex">
          <button 
            onClick={() => toast.info("Выбор города находится в разработке")}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground active:scale-95"
          >
            <MapPin className="h-3.5 w-3.5" />
            москва
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-border pl-2 pr-3 py-1 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all active:scale-95"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar.startsWith("http") ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${user.avatar}`}
                    alt={user.nickname}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                )}
                <span>{user.nickname}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all active:scale-90"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:border-foreground/40 hover:bg-foreground/5 active:scale-95"
            >
              Войти
            </Link>
          )}
        </div>

        {/* Mobile Actions Container (Login/Profile/City + Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 md:hidden">
          <button 
            onClick={() => toast.info("Выбор города находится в разработке")}
            className="flex items-center gap-1 rounded-full border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-muted-foreground bg-surface transition-all hover:border-foreground/30 hover:text-foreground active:scale-95 mr-1"
          >
            <MapPin className="h-3 w-3 text-accent" />
            <span className="hidden sm:inline">москва</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {isAuthenticated && user ? (
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface overflow-hidden hover:bg-foreground/5 transition-all active:scale-90"
            >
              {user.avatar ? (
                <img
                  src={user.avatar.startsWith("http") ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${user.avatar}`}
                  alt={user.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/10 text-accent">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-border px-3.5 py-1 text-xs font-bold text-foreground transition-all hover:border-foreground/40 hover:bg-foreground/5 active:scale-95"
            >
              Войти
            </Link>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground z-50 relative rounded-full hover:bg-secondary transition-all active:scale-90"
            aria-label="Открыть меню"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 animate-in spin-in-90 duration-200" />
            ) : (
              <Menu className="h-5 w-5 animate-in fade-in duration-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-x-0 top-[72px] h-[calc(100dvh-72px)] z-[150] bg-background/40 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Menu Content */}
          <div 
            className="bg-background/95 border-b border-border shadow-xl flex flex-col p-6 animate-in slide-in-from-top-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-6 py-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-lg font-bold transition-all py-2 border-b border-border/50 active:scale-95 active:opacity-70",
                      isActive ? "text-accent" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
