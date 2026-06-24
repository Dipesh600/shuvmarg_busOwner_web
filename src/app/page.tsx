import HeroSection from "@/components/sections/HeroSection";
import OnboardingStepsSection from "@/components/sections/OnboardingStepsSection";
import PlatformFeaturesSection from "@/components/sections/PlatformFeaturesSection";
import PartnerTypesSection from "@/components/sections/PartnerTypesSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import ShowcaseSection from "@/components/sections/ShowcaseSection";
import GrowthLeversSection from "@/components/sections/GrowthLeversSection";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <OnboardingStepsSection />
      <PlatformFeaturesSection />
      <PartnerTypesSection />
      <BenefitsSection />
      <ShowcaseSection />
      <GrowthLeversSection />
      <TestimonialSection />
      <FAQSection />
      <Footer />
    </>
  );
}
