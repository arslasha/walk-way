import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      {/* Absolute Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center justify-between pointer-events-none">
        <Link 
          href="/explore" 
          className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-md shadow-md pointer-events-auto hover:bg-background transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Link>
      </div>

      {/* Map Placeholder Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h1 className="text-headline-sm font-bold text-foreground mb-3">
          Карта в разработке
        </h1>
        <p className="text-body-md text-muted-foreground max-w-[300px]">
          Совсем скоро здесь появится интерактивная карта с вашими маршрутами.
        </p>
        <Link 
          href="/explore"
          className="mt-8 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
        >
          Вернуться к поиску
        </Link>
      </div>
    </div>
  );
}
