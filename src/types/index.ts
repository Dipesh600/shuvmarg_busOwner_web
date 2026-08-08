// ─── Lead Form ────────────────────────────────────────────────────
export interface LeadFormData {
  operatorName: string;
  contactName: string;
  contactMobile: string;
  operatingCity: string;
  fleetSize: string;
}

// ─── Stats ────────────────────────────────────────────────────────
export interface StatItem {
  id: string;
  end: number;
  prefix?: string;
  suffix?: string;
  duration: number;
  label: string;
  accentColor?: boolean; // if true, uses maroon color
}

// ─── Partner Cards ────────────────────────────────────────────────
export interface PartnerCard {
  id: string;
  icon: string; // material symbol name
  title: string;
  description: string;
  ctaLabel: string;
  ctaBadge: string;
  ctaType: "link" | "modal" | "register-action";
  href?: string;
  modalMessage?: string;
}

// ─── Benefit Cards ────────────────────────────────────────────────
export interface BenefitCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// ─── FAQ ──────────────────────────────────────────────────────────
export interface FAQItemData {
  id: number;
  question: string;
  answer: string;
}
