import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { LogoBeltSection } from "@/components/LogoBeltSection";
import { CaseSpotlights } from "@/components/CaseSpotlights";
import { ProgramsSection } from "@/components/ProgramsSection";
import { PricingSection } from "@/components/PricingSection";
import { RoiQuickcheckSection } from "@/components/RoiQuickcheck";
import { HowWeWorkSection } from "@/components/HowWeWorkSection";
import { GuaranteeRail } from "@/components/GuaranteeRail";
import { FaqSection } from "@/components/FaqSection";

export const metadata: Metadata = {
  title: "MaydaLabs – Growth partner for digital-first brands",
  description:
    "MaydaLabs works with digital brands, SaaS, and service firms who already have traffic but need clean tracking, focused CRO sprints, and lifecycle systems to turn that traffic into revenue.",
};

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <HeroSection />
      <LogoBeltSection />
      <CaseSpotlights />
      <ProgramsSection />
      <PricingSection />
      <RoiQuickcheckSection />
      <HowWeWorkSection />
      <GuaranteeRail />
      <FaqSection />
    </div>
  );
}
