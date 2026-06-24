"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQItemData } from "@/types";

interface FAQItemProps {
  item: FAQItemData;
}

export default function FAQItem({ item }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-colors hover:border-neutral-300">
      <button
        id={`faq-toggle-${item.id}`}
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 transition-colors hover:bg-neutral-50"
        aria-expanded={open}
        aria-controls={`faq-content-${item.id}`}
      >
        <span className="font-semibold text-sm text-neutral-900">{item.question}</span>
        <motion.span
          className="material-symbols-rounded text-maroon flex-shrink-0"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 20 }}
        >
          add
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-content-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-5 pb-5 pt-3 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
