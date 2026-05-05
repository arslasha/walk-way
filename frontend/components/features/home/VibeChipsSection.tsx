"use client";

import { useState } from "react";
import { VIBES } from "@/constants/vibes";
import { cn } from "@/lib/utils";

export function VibeChipsSection() {
  const [activeVibe, setActiveVibe] = useState(VIBES[0].value);

  return (
    <section className="ww-container pb-12">
      <p className="mb-4 text-sm font-semibold text-muted-foreground">
        выберите настроение
      </p>
      <div className="flex flex-wrap gap-2">
        {VIBES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveVibe(value)}
            className={cn("chip", activeVibe === value && "chip-active")}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
