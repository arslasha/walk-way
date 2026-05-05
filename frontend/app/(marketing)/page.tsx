import { HeroSection } from "@/components/features/home/HeroSection";
import { VibeChipsSection } from "@/components/features/home/VibeChipsSection";
import { FeaturedPlacesSection } from "@/components/features/home/FeaturedPlacesSection";
import { CtaBanner } from "@/components/features/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <VibeChipsSection />
      <FeaturedPlacesSection />
      <CtaBanner />
    </>
  );
}
