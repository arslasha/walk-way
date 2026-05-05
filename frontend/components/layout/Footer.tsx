import Link from "next/link";
import { FOOTER_LINKS } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="w-full border-t border-ww-border bg-ww-footer-bg">
      <div className="ww-container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-3 md:col-span-1">
            <Link
              href="/"
              className="font-heading text-xl font-bold text-foreground transition-colors hover:text-foreground/80"
            >
              Walk-Way
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              городской гид по вайбу
            </p>
            <p className="mt-auto pt-8 text-xs text-muted-foreground/60">
              © 2025 Walk-Way. Все права защищены.
            </p>
          </div>

          {Object.values(FOOTER_LINKS).map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <p className="text-label-caps text-muted-foreground/60">{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
