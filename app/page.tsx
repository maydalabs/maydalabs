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
    <>
      <HeroSection />
      <LogoBeltSection />
      <CaseSpotlights />
      <ProgramsSection />
      <PricingSection />
      <RoiQuickcheckSection
        kicker="Estimate upside"
        heading="See what a modest lift could be worth before you commit."
        subheading="Use the quickcheck to sanity-check likely payback, pressure-test the upside, and see which engagement makes the most sense as a starting point."
      />
      <HowWeWorkSection
        heading="What happens next"
        subheading="If the numbers make sense, this is the operating rhythm from kickoff to shipped fixes and measured lift."
      />
      <GuaranteeRail />
      <FaqSection />
    </>
  );
}
