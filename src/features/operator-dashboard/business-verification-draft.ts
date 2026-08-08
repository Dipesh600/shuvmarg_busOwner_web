import { NEPAL_SETTLEMENT_INSTITUTION_NAMES } from "./nepal-settlement-institutions.ts";

export interface BusinessVerificationDraft {
  companyName: string;
  ownerName: string;
  registeredTole: string;
  registeredWardNumber: string;
  registeredMunicipality: string;
  registeredDistrict: string;
  registeredProvince: string;
  registeredPostalCode: string;
  registeredCountry: string;
  panNumber: string;
  registrationNumber: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  swiftCode: string;
}

export interface BusinessDraftProgress {
  businessComplete: boolean;
  settlementComplete: boolean;
  documentsComplete: boolean;
  percentage: number;
  nextStep: 0 | 1 | 2 | 3;
}

export const EMPTY_BUSINESS_VERIFICATION_DRAFT: BusinessVerificationDraft = {
  companyName: "",
  ownerName: "",
  registeredTole: "",
  registeredWardNumber: "",
  registeredMunicipality: "",
  registeredDistrict: "",
  registeredProvince: "",
  registeredPostalCode: "",
  registeredCountry: "Nepal",
  panNumber: "",
  registrationNumber: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  branchName: "",
  swiftCode: "",
};

export const BUSINESS_FIELDS: Array<keyof BusinessVerificationDraft> = [
  "companyName",
  "ownerName",
  "registeredTole",
  "registeredWardNumber",
  "registeredMunicipality",
  "registeredDistrict",
  "registeredProvince",
  "registeredCountry",
  "panNumber",
  "registrationNumber",
];

export const SETTLEMENT_FIELDS: Array<keyof BusinessVerificationDraft> = [
  "bankName",
  "accountHolderName",
  "accountNumber",
  "branchName",
];

export const BUSINESS_FIELD_MAX_LENGTHS: Record<
  keyof BusinessVerificationDraft,
  number
> = {
  companyName: 200,
  ownerName: 200,
  registeredTole: 150,
  registeredWardNumber: 2,
  registeredMunicipality: 100,
  registeredDistrict: 100,
  registeredProvince: 50,
  registeredPostalCode: 5,
  registeredCountry: 50,
  panNumber: 9,
  registrationNumber: 100,
  bankName: 200,
  accountHolderName: 200,
  accountNumber: 50,
  branchName: 200,
  swiftCode: 11,
};

const MIN_LENGTHS: Partial<Record<keyof BusinessVerificationDraft, number>> = {
  companyName: 2,
  ownerName: 2,
  registeredTole: 2,
  registeredWardNumber: 1,
  registeredMunicipality: 2,
  registeredDistrict: 2,
  panNumber: 9,
  registrationNumber: 2,
  bankName: 2,
  accountHolderName: 2,
  accountNumber: 5,
  branchName: 2,
};

const FIELD_LABELS: Record<keyof BusinessVerificationDraft, string> = {
  companyName: "Legal company name",
  ownerName: "Owner name",
  registeredTole: "Tole / locality",
  registeredWardNumber: "Ward number",
  registeredMunicipality: "Municipality / rural municipality",
  registeredDistrict: "District",
  registeredProvince: "Province",
  registeredPostalCode: "Postal code",
  registeredCountry: "Country",
  panNumber: "PAN number",
  registrationNumber: "Registration number",
  bankName: "Bank name",
  accountHolderName: "Account holder name",
  accountNumber: "Account number",
  branchName: "Branch name",
  swiftCode: "SWIFT/BIC",
};

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const ACCOUNT_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ./-]*[A-Za-z0-9]$/;
const SWIFT_BIC_PATTERN = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/;

export type BusinessDraftFieldErrors = Partial<
  Record<keyof BusinessVerificationDraft, string>
>;

export function getBusinessDraftFieldError(
  field: keyof BusinessVerificationDraft,
  rawValue: string
): string | null {
  const value = rawValue.trim();
  const label = FIELD_LABELS[field];

  if (!value) {
    return ["swiftCode", "registeredPostalCode"].includes(field)
      ? null
      : `${label} is required.`;
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return `${label} contains unsupported characters.`;
  }
  const min = MIN_LENGTHS[field];
  if (min && value.length < min) {
    return `${label} must contain at least ${min} characters.`;
  }
  if (value.length > BUSINESS_FIELD_MAX_LENGTHS[field]) {
    return `${label} is too long.`;
  }
  if (field === "panNumber" && !/^\d{9}$/.test(value)) {
    return "PAN number must contain exactly 9 digits.";
  }
  if (field === "registeredPostalCode" && !/^\d{5}$/.test(value)) {
    return "Postal code must contain exactly 5 digits.";
  }
  if (field === "registeredWardNumber" && !/^[1-9]\d?$/.test(value)) {
    return "Ward number must be between 1 and 99.";
  }
  if (field === "registeredCountry" && value !== "Nepal") {
    return "Country must be Nepal for this operator application.";
  }
  if (field === "bankName" && !NEPAL_SETTLEMENT_INSTITUTION_NAMES.has(value)) {
    return "Select a bank or financial institution from the NRB list.";
  }
  if (field === "accountNumber" && !ACCOUNT_NUMBER_PATTERN.test(value)) {
    return "Account number can use letters, numbers, spaces, dots, slashes and hyphens.";
  }
  if (field === "swiftCode" && !SWIFT_BIC_PATTERN.test(value.toUpperCase())) {
    return "SWIFT/BIC must contain 8 or 11 valid characters.";
  }
  return null;
}

export function validateBusinessDraftFields(
  draft: BusinessVerificationDraft,
  fields: Array<keyof BusinessVerificationDraft>
): BusinessDraftFieldErrors {
  return Object.fromEntries(
    fields.flatMap((field) => {
      const error = getBusinessDraftFieldError(field, draft[field]);
      return error ? [[field, error]] : [];
    })
  );
}

export function formatRegisteredAddressPreview(
  draft: Pick<
    BusinessVerificationDraft,
    | "registeredTole"
    | "registeredWardNumber"
    | "registeredMunicipality"
    | "registeredDistrict"
    | "registeredProvince"
  >
): string {
  return [
    draft.registeredTole.trim(),
    draft.registeredWardNumber.trim()
      ? `Ward ${draft.registeredWardNumber.trim()}`
      : "",
    draft.registeredMunicipality.trim(),
    draft.registeredDistrict.trim(),
    draft.registeredProvince.trim()
      ? `${draft.registeredProvince.trim()} Province`
      : "",
    "Nepal",
  ]
    .filter(Boolean)
    .join(", ");
}

function fieldsAreComplete(
  draft: BusinessVerificationDraft,
  fields: Array<keyof BusinessVerificationDraft>
): boolean {
  return fields.every((field) => !getBusinessDraftFieldError(field, draft[field]));
}

export function calculateBusinessDraftProgress(
  draft: BusinessVerificationDraft,
  documentFields: Iterable<string>
): BusinessDraftProgress {
  const documents = new Set(documentFields);
  const businessComplete = fieldsAreComplete(draft, BUSINESS_FIELDS);
  const settlementComplete = fieldsAreComplete(draft, SETTLEMENT_FIELDS);
  const documentsComplete = [
    "companyRegistration",
    "taxRegistration",
    "ownerIdentity",
  ].every((field) => documents.has(field));

  const completedSections = [
    businessComplete,
    settlementComplete,
    documentsComplete,
  ].filter(Boolean).length;

  return {
    businessComplete,
    settlementComplete,
    documentsComplete,
    percentage: 25 + completedSections * 25,
    nextStep: !businessComplete
      ? 0
      : !settlementComplete
        ? 1
        : !documentsComplete
          ? 2
          : 3,
  };
}
