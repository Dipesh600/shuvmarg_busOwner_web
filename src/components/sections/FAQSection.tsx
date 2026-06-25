"use client";
import { useState } from "react";
import FAQItem from "@/components/ui/FAQItem";
import { FAQItemData } from "@/types";

const faqs: FAQItemData[] = [
  {
    id: 1,
    question: "How do I register as a bus operator?",
    answer:
      "Fill in the registration form at the top of this page with your mobile number. An onboarding manager will contact you to collect KYC details (PAN/VAT, company registration copy, and settlement bank details). Approval generally takes 24–48 business hours.",
  },
  {
    id: 2,
    question: "What are the commission charges?",
    answer:
      "Our standard platform commission is 8% of the net ticket fare. There are no hidden setup fees, subscription costs, or scheduling fees. We only earn when you sell seats.",
  },
  {
    id: 3,
    question: "How do bank payouts work?",
    answer:
      "Payout batches run weekly. Completed trips are automatically reconciled, commissions deducted, and the net payout is deposited in your registered bank account every Monday. You can review all settlement batch details on your partner console.",
  },
  {
    id: 4,
    question: "Can I manage multiple buses under one account?",
    answer:
      "Yes. The Shuvmarg Partner console supports fleet grouping. You can add unlimited buses, assign them to routes, set pricing per route, and group sister buses to share layouts — all from a single login.",
  },
  {
    id: 5,
    question: "What documentation is needed for onboarding?",
    answer:
      "You will need: (1) Company PAN or VAT certificate, (2) Business registration certificate, (3) Blue Book / Lalpurja of each bus, (4) Route permit copies, and (5) Bank account details for settlement. Our onboarding team will guide you through document upload.",
  },
  {
    id: 6,
    question: "Do I need technical knowledge to use the platform?",
    answer:
      "Not at all. The Shuvmarg dashboard is designed to be highly intuitive. If you can use a smartphone, you can manage your fleet. Our team also provides a free 30-minute training session during onboarding.",
  },
  {
    id: 7,
    question: "How does Shuvmarg help fill empty seats?",
    answer:
      "By connecting your inventory to Nepal's largest digital passenger network, we increase your visibility. Passengers can discover and book your bus 24/7, significantly reducing last-minute empty seats.",
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<number | string | null>(null);
  return (
    <section id="faq" className="py-24 relative bg-[#FAFAFA] w-full">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">

        {/* Centered Heading */}
        <div className="mb-14 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 flex-shrink-0" style={{ background: "#C99A4A" }} />
            <span className="text-[12px] font-medium tracking-wide" style={{ color: "#7A1D1B" }}>Faq</span>
            <div className="h-px w-8 flex-shrink-0" style={{ background: "#C99A4A" }} />
          </div>
          <h2
            className="font-bold tracking-tight"
            style={{
              fontSize: "clamp(32px, 4vw, 44px)",
              color: "#111111",
              letterSpacing: "-0.025em",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.15,
            }}
          >
            Questions, <em style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontStyle: "italic", color: "#666666" }}>answered</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Contact Support Card */}
          <div className="lg:col-span-4">
            <div
              className="p-8 rounded-[24px] flex flex-col items-center text-center"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E0D4",
                boxShadow: "0 4px 24px rgba(0,0,0,0.02)"
              }}
            >
              {/* Support Icon */}
              <div
                className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6"
                style={{ background: "#FFF4F3", border: "1px solid rgba(122,29,27,0.15)" }}
              >
                <span className="material-symbols-rounded text-[24px]" style={{ color: "#7A1D1B" }}>
                  support_agent
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-bold mb-3 tracking-tight" style={{ fontSize: "20px", color: "#111111" }}>
                Still have questions?
              </h3>
              <p className="mb-8" style={{ fontSize: "15px", color: "#666666", lineHeight: 1.6 }}>
                Our team will walk you through the Shuv Marg platform for your specific fleet requirements.
              </p>

              {/* Contact Action Pills */}
              <div className="flex flex-col gap-3 w-full">
                <a
                  href="tel:+9779803643115"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] transition-colors hover:bg-neutral-50"
                  style={{ background: "#FAFAFA", border: "1px solid #EEEEEE" }}
                >
                  <span className="material-symbols-rounded text-[18px]" style={{ color: "#7A1D1B" }}>call</span>
                  <span className="font-semibold" style={{ fontSize: "14px", color: "#111111" }}>+977 9803643115</span>
                </a>
                <a
                  href="mailto:support@shuvmarg.com"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] transition-colors hover:bg-neutral-50"
                  style={{ background: "#FAFAFA", border: "1px solid #EEEEEE" }}
                >
                  <span className="material-symbols-rounded text-[18px]" style={{ color: "#7A1D1B" }}>mail</span>
                  <span className="font-semibold" style={{ fontSize: "14px", color: "#111111" }}>support@shuvmarg.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordions */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {faqs.map((faq) => (
              <FAQItem 
                key={faq.id} 
                item={faq} 
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
