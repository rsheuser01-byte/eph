"use client";

import { useState } from "react";
import { faqs } from "@/data/site";

export function FaqList() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="border-t border-line">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="border-b border-line">
            <button
              type="button"
              className="faq-trigger flex w-full items-center justify-between gap-4 py-5 text-left transition hover:bg-bg-elevated/90"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
                {faq.question}
              </span>
              <span className="faq-icon font-display text-xl leading-none text-accent" aria-hidden>
                +
              </span>
            </button>
            <div className="faq-panel" data-open={isOpen}>
              <div className="faq-panel-inner">
                <p className="pb-5 pr-8 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
