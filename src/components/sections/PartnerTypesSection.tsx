"use client";

import { PartnerCard } from "@/types";

interface ExtendedPartnerCard extends PartnerCard {
  image?: string;
}

const partnerCards: ExtendedPartnerCard[] = [
  {
    id: "fleet",
    icon: "directions_bus",
    image: "/images/fleet registration.png",
    title: "Register Your Fleet",
    description: "For fleet operators running AC, Sleeper, or Deluxe long-distance buses. Automate inventory sales across Nepal.",
    ctaLabel: "Register Now",
    ctaBadge: "World-class Tech",
    ctaType: "link",
    href: "#register-form",
  },
  {
    id: "agent",
    icon: "support_agent",
    image: "/images/agent rgistration.png",
    title: "Become a Ticketing Agent",
    description: "For local travel agencies, counters, and digital points. Sell Shuvmarg tickets and earn high commission margins.",
    ctaLabel: "Join Agent Network",
    ctaBadge: "Earn Commission",
    ctaType: "modal",
    modalMessage: "To join the Shuvmarg Agent Network, please email agent@shuvmarg.com or contact 9851090284.",
  },
  {
    id: "vendor",
    icon: "storefront",
    image: "/images/vendor.png",
    title: "Register as Terminal Vendor",
    description: "For bus stations, booking gates, and terminal vendors. Integrate with the local dispatcher pipeline.",
    ctaLabel: "Learn More",
    ctaBadge: "Terminal Gate",
    ctaType: "modal",
    modalMessage: "Terminal vendor systems are currently under restricted beta. Reach out to station-manager@shuvmarg.com.",
  },
];

export default function PartnerTypesSection() {
  const handleCta = (card: PartnerCard) => {
    if (card.ctaType === "modal" && card.modalMessage) {
      alert(card.modalMessage);
    }
  };

  return (
    <section id="partners" className="py-20 relative bg-[#FAFAFA] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-[#FAFAFA] mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C99A4A]" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
              Partner Network
            </span>
          </div>
          <h2 className="font-bold text-[#111111] leading-[1.15] tracking-tight mb-4" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
            Who can join the platform?
          </h2>
          <p className="text-[#666666] text-lg leading-relaxed">
            Shuv Marg connects the entire transportation ecosystem. Whether you own the buses, sell the tickets, or manage the terminals, there's a specialized suite built for you.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-6">
          {partnerCards.map((card) => (
            <div
              key={card.id}
              className="w-full max-w-[400px] sm:max-w-none sm:w-[calc(50%_-_0.75rem)] lg:w-[calc(33.333%_-_1rem)] group flex flex-col bg-white rounded-[24px] border border-neutral-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-neutral-300 transition-all duration-500"
            >
              {/* Image Header */}
              <div className="relative w-full h-48 bg-[#FAFAFA] border-b border-neutral-100 flex items-center justify-center overflow-hidden">
                {card.image ? (
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    className="w-full h-full object-contain drop-shadow-md transform group-hover:scale-[1.05] transition-transform duration-700 ease-out p-6" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0]">
                    <span className="material-symbols-rounded text-[48px] text-[#C99A4A]/40 group-hover:text-[#C99A4A]/60 transition-colors duration-300">
                      {card.icon}
                    </span>
                    <span className="text-[#888888] text-xs uppercase tracking-widest font-semibold">Coming Soon</span>
                  </div>
                )}
                
                {/* Floating Badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/50 text-[#111111] shadow-sm">
                    {card.ctaBadge}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 p-6 flex flex-col">
                <h3 className="font-bold text-[#111111] text-[20px] mb-3 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-[#666666] text-[15px] leading-[1.6] mb-8 flex-1">
                  {card.description}
                </p>

                {/* Footer CTA */}
                <div className="pt-5 border-t border-neutral-100">
                  {card.ctaType === "link" ? (
                    <a
                      href={card.href}
                      className="inline-flex items-center gap-2 font-bold text-[#7A1D1B] transition-all group-hover:gap-3 group-hover:text-[#9A2622]"
                    >
                      <span className="text-[14px] uppercase tracking-wide">{card.ctaLabel}</span>
                      <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCta(card)}
                      className="inline-flex items-center gap-2 font-bold text-[#7A1D1B] transition-all group-hover:gap-3 group-hover:text-[#9A2622]"
                    >
                      <span className="text-[14px] uppercase tracking-wide">{card.ctaLabel}</span>
                      <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
