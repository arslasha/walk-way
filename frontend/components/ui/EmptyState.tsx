import Link from "next/link";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title = "Ничего не найдено",
  description = "По вашему запросу нет подходящих мест. Попробуйте изменить фильтры или радиус поиска.",
  actionHref = "/explore",
  actionLabel = "Сбросить фильтры",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[40px] border border-border bg-card py-24 text-center px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ww-ink/5">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-headline-md text-foreground">{title}</h3>
      <p className="mb-8 max-w-md text-body-lg text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-accent">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
