import { cn } from "@/lib/utils";

interface LoaderProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loader({ message, className, size = "md" }: LoaderProps) {
  const spinnerSize = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-[3px]",
    lg: "h-14 w-14 border-4",
  }[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-muted border-t-accent",
          spinnerSize
        )}
      />
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );
}
