export interface NepalSettlementInstitutionGroup {
  category: string;
  institutions: readonly string[];
}

// Nepal Rastra Bank: List of Banks and Financial Institutions, Mid June 2026.
// Class D microfinance institutions are intentionally excluded because this is
// a settlement account selector, not a borrowing-institution directory.
export const NEPAL_SETTLEMENT_INSTITUTION_GROUPS: readonly NepalSettlementInstitutionGroup[] = [
  {
    category: "Commercial banks",
    institutions: [
      "Nepal Bank Ltd.",
      "Agricultural Development Bank Ltd.",
      "Nabil Bank Ltd.",
      "Nepal Investment Mega Bank Ltd.",
      "Standard Chartered Bank Nepal Ltd.",
      "Himalayan Bank Ltd.",
      "Nepal SBI Bank Ltd.",
      "Everest Bank Ltd.",
      "Kumari Bank Ltd.",
      "Laxmi Sunrise Bank Ltd.",
      "Citizens Bank International Ltd.",
      "Prime Commercial Bank Ltd.",
      "Sanima Bank Ltd.",
      "Machhapuchhre Bank Ltd.",
      "NIC Asia Bank Ltd.",
      "Global IME Bank Ltd.",
      "NMB Bank Ltd.",
      "Prabhu Bank Ltd.",
      "Siddhartha Bank Ltd.",
      "Rastriya Banijya Bank Ltd.",
    ],
  },
  {
    category: "Development banks",
    institutions: [
      "Narayani Development Bank Ltd.",
      "Karnali Development Bank Ltd.",
      "Excel Development Bank Ltd.",
      "Miteri Development Bank Ltd.",
      "Muktinath Bikas Bank Ltd.",
      "Corporate Development Bank Ltd.",
      "Sindhu Bikas Bank Ltd.",
      "Salapa Bikash Bank Ltd.",
      "Green Development Bank Ltd.",
      "Sangrila Development Bank Ltd.",
      "Shine Resunga Development Bank Ltd.",
      "Jyoti Bikas Bank Ltd.",
      "Garima Bikas Bank Ltd.",
      "Mahalaxmi Bikas Bank Ltd.",
      "Lumbini Bikas Bank Ltd.",
      "Kamana Sewa Bikas Bank Ltd.",
      "Saptakoshi Development Bank Ltd.",
    ],
  },
  {
    category: "Finance companies",
    institutions: [
      "Nepal Finance Ltd.",
      "Nepal Share Markets and Finance Ltd.",
      "Goodwill Finance Ltd.",
      "Progressive Finance Ltd.",
      "Janaki Finance Co. Ltd.",
      "Pokhara Finance Ltd.",
      "Multipurpose Finance Ltd.",
      "Samriddhi Finance Company Limited",
      "Capital Merchant Banking & Finance Ltd.",
      "Guheshwori Merchant Banking & Finance Ltd.",
      "ICFC Finance Ltd.",
      "Manjushree Finance Ltd.",
      "Reliance Finance Ltd.",
      "Gurkhas Finance Ltd.",
      "Shree Investment & Finance Co. Ltd.",
      "Central Finance Ltd.",
      "Best Finance Ltd.",
    ],
  },
] as const;

export const NEPAL_SETTLEMENT_INSTITUTION_NAMES = new Set(
  NEPAL_SETTLEMENT_INSTITUTION_GROUPS.flatMap((group) => group.institutions)
);

const LEGACY_INSTITUTION_NAMES: Readonly<Record<string, string>> = {
  "Nepal Bank": "Nepal Bank Ltd.",
};

export function normalizeNepalSettlementInstitutionName(value: string): string {
  const trimmed = value.trim();
  return LEGACY_INSTITUTION_NAMES[trimmed] || trimmed;
}
