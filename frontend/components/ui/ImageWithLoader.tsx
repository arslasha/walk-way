"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader } from "./Loader";
import { cn } from "@/lib/utils";

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ImageWithLoader({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: ImageWithLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader size="sm" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={true}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
