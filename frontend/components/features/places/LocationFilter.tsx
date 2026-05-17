"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LocationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isActive = searchParams.has("lat") && searchParams.has("lon");

  const toggleLocation = () => {
    if (isActive) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("lat");
      params.delete("lon");
      params.delete("radius");
      router.push(`/explore?${params.toString()}`);
      return;
    }

    if (!navigator.geolocation) {
      setErrorMsg("Геолокация не поддерживается браузером");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", latitude.toString());
        params.set("lon", longitude.toString());
        // Default radius to 2000m (2km)
        params.set("radius", "2000");
        router.push(`/explore?${params.toString()}`);
      },
      (error) => {
        setIsLoading(false);
        setErrorMsg("Не удалось получить геопозицию");
        console.error("Geolocation error:", error);
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLocation}
        disabled={isLoading}
        className={`chip whitespace-nowrap ${isActive ? "chip-active" : ""} ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? "Поиск..." : isActive ? "Сбросить гео" : "Рядом со мной"}
      </button>
      {errorMsg && <span className="text-sm text-red-500">{errorMsg}</span>}
    </div>
  );
}
