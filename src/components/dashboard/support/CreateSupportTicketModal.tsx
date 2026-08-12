"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSupportTicketModal({
  isOpen,
  onClose,
}: CreateSupportTicketModalProps) {
  const [topic, setTopic] = useState("Bank & Payouts");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!message.trim()) {
      setErrorMsg("Please write a short message explaining what you need help with.");
      return;
    }

    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 500);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setReference("");
    setMessage("");
    setErrorMsg("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4"
      onClick={handleResetAndClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full flex flex-col border border-[#EEE8E2] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEE8E2] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7A1D1B]/10 border border-[#7A1D1B]/20 flex items-center justify-center text-[#7A1D1B] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Send a Message
              </h3>
              <p className="text-xs text-neutral-500">
                Our support team will call or reply to you quickly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-2xl border border-[#EEE8E2] hover:bg-white flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {isSuccess ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900">
                  Message Sent Successfully!
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  We have received your message. A support representative will call or message your phone shortly.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-[#7A1D1B] text-white text-xs font-bold rounded-2xl hover:bg-[#5C1414] transition-all shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Topic Select */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  What do you need help with?
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs font-semibold text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all"
                >
                  <option value="Bank & Payouts">Bank &amp; Ticket Payouts</option>
                  <option value="Bus & Documents">Adding / Verifying My Bus</option>
                  <option value="Routes & Schedule">Routes &amp; Schedule Setup</option>
                  <option value="Road Emergency">Bus Breakdown on the Road</option>
                  <option value="Passenger Issue">Passenger / Ticket Question</option>
                  <option value="Other">Other Question</option>
                </select>
              </div>

              {/* Optional Reference */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Bus Number or Phone Number <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., Ba 2 Kha 4920"
                  className="w-full h-11 px-4 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className="w-full p-3.5 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EEE8E2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="h-11 px-4 rounded-2xl border border-[#EEE8E2] text-neutral-600 hover:bg-neutral-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 h-11 px-6 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs font-bold rounded-2xl transition-all shadow-2xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
