import Image from "next/image";

const steps = [
  {
    step: 1,
    title: "Partner Registration",
    description: "Create your account via mobile OTP and submit your business and banking details.",
    image: "/images/register.png",
  },
  {
    step: 2,
    title: "KYC Verification",
    description: "Upload PAN, registration documents, and route permits for admin approval.",
    image: "/images/kyc.png",
  },
  {
    step: 3,
    title: "Fleet Verification",
    description: "Add your buses and submit them for compliance verification.",
    image: "/images/fleet registration.png",
  },
  {
    step: 4,
    title: "Start Selling",
    description: "Map routes, schedule trips, and start receiving bookings immediately.",
    image: "/images/start_selling.png",
  },
];

export default function OnboardingStepsSection() {
  return (
    <section id="how-it-works" className="pt-12 pb-16 relative bg-[#FDFAF6]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <div className="mb-12 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-8 flex-shrink-0 bg-[#C99A4A]/50" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1D1B]">
              How it works
            </span>
            <div className="h-px w-8 flex-shrink-0 bg-[#C99A4A]/50" />
          </div>
          <h2 className="font-bold text-[#111111] leading-[1.15] tracking-tight mb-4 text-3xl md:text-[34px]">
            Launch your digital operations in <br className="hidden sm:block" /><span className="text-[#888888]">under 48 hours.</span>
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex flex-col bg-white rounded-[16px] border border-neutral-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 p-3"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[16/9] bg-[#F9F9F9] rounded-[10px] overflow-hidden mb-5 group shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] border border-neutral-100/50">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 280px"
                  className="object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Text Container */}
              <div className="px-3 pb-3">
                <h3 className="text-[18px] font-bold text-[#111111] mb-2 tracking-tight">
                  {s.step}. {s.title}
                </h3>
                <p className="text-[#666666] text-[14px] leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
