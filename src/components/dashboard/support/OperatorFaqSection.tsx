"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { OPERATOR_FAQS, FAQ_CATEGORIES, OperatorFAQItem } from "./faq-data";

interface OperatorFaqSectionProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export default function OperatorFaqSection({
  searchQuery,
  onClearSearch,
}: OperatorFaqSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "kyc-1": true,
    "finance-1": true,
  });

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs: OperatorFAQItem[] = OPERATOR_FAQS.filter((faq) => {
    const matchesSearch =
      !searchQuery.trim() ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEE8E2]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#7A1D1B]" />
            <span>Common Questions &amp; Answers</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quick answers about adding buses, payouts, routes, and tickets.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {FAQ_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#7A1D1B] text-white shadow-2xs"
                  : "bg-[#FAF8F5] text-neutral-600 hover:bg-neutral-100 border border-[#EEE8E2]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      {filteredFaqs.length > 0 ? (
        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isOpen = Boolean(openFaqIds[faq.id]);

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-[#EEE8E2] bg-[#FAF8F5]/60 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors gap-4"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-neutral-900">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-neutral-800" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-[13px] text-neutral-600 leading-relaxed border-t border-[#EEE8E2] bg-white">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 px-4 text-center bg-[#FAF8F5] border border-[#EEE8E2] rounded-2xl">
          <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-neutral-900 mb-1">
            No matching questions found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-3">
            We couldn&apos;t find any answer matching &ldquo;{searchQuery}&rdquo;. Try searching different words or send us a message above.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-[#EEE8E2] transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
