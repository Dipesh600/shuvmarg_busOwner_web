import OnboardingWizard from "@/components/ui/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-24">
        {/* Page header */}
        <div className="text-center pt-8 pb-2">
          <span className="eyebrow">Partner Onboarding</span>
          <h1 className="text-3xl font-bold text-neutral-900 mt-2">
            Complete your registration
          </h1>
          <p className="text-neutral-500 mt-2 text-sm max-w-md mx-auto">
            Fill in the required details to activate your Shuvmarg Partner account.
            The process takes under 10 minutes.
          </p>
        </div>

        <OnboardingWizard />
      </div>
    </div>
  );
}
