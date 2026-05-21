"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, User as UserIcon, LogOut } from "lucide-react";
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
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success("Вы вышли из системы");
    router.push("/");
  };

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
          {isAuthenticated && (
            <NavLink href="/profile" label="Профиль" />
          )}
        </nav>


        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
            <MapPin className="h-3.5 w-3.5" />
            москва
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-border pl-2 pr-3 py-1 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:border-foreground/40 hover:bg-foreground/5"
            >
              Войти
            </Link>
          )}
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
