import type {
  BusOwnerKycStatus,
  KycDocumentDescriptor,
} from "./operator-dashboard-contract.ts";

const KYC_DOCUMENT_FIELDS = [
  ["companyRegistration", "Company registration"],
  ["taxRegistration", "PAN / tax registration"],
  ["ownerIdentity", "Owner citizenship"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasUploadedFile(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasUploadedFile);
  if (!isRecord(value)) return false;

  if (value.uploaded === true || value.present === true || value.available === true) {
    return true;
  }
  if (typeof value.fileCount === "number" && value.fileCount > 0) return true;
  if (Array.isArray(value.items)) return value.items.some(hasUploadedFile);
  return false;
}

function getFileCount(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((total, item) => total + getFileCount(item), 0);
  if (!isRecord(value)) return 0;
  if (typeof value.fileCount === "number") return value.fileCount;
  if (Array.isArray(value.items)) return value.items.reduce((total, item) => total + getFileCount(item), 0);
  return hasUploadedFile(value) ? 1 : 0;
}

function getRejectionReason(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.map(getRejectionReason).find(Boolean) || null;
  }
  if (!isRecord(value)) return null;
  if (typeof value.rejectionReason === "string" && value.rejectionReason.trim()) {
    return value.rejectionReason;
  }
  if (Array.isArray(value.items)) {
    return value.items.map(getRejectionReason).find(Boolean) || null;
  }
  return null;
}

/** Normalize every supported KYC status response into the dashboard contract. */
export function normalizeKycStatusPayload(payload: unknown): BusOwnerKycStatus | null {
  if (!isRecord(payload)) return null;

  const normalizedDocuments: KycDocumentDescriptor[] = [];
  const documents = payload.documents;

  if (Array.isArray(documents)) {
    for (const document of documents) {
      if (!isRecord(document)) continue;
      normalizedDocuments.push({
        documentType: String(document.documentType || document.slot || "document"),
        label: typeof document.label === "string" ? document.label : undefined,
        uploaded: hasUploadedFile(document),
        fileCount: getFileCount(document),
        status: typeof document.status === "string" ? document.status : undefined,
        rejectionReason:
          typeof document.rejectionReason === "string" ? document.rejectionReason : null,
      });
    }
  } else if (isRecord(documents)) {
    for (const [documentType, document] of Object.entries(documents)) {
      normalizedDocuments.push({
        documentType,
        uploaded: hasUploadedFile(document),
        fileCount: getFileCount(document),
        rejectionReason: getRejectionReason(document),
      });
    }
  }

  for (const [documentType, label] of KYC_DOCUMENT_FIELDS) {
    if (!(documentType in payload)) continue;
    const existingIndex = normalizedDocuments.findIndex(
      (document) => document.documentType === documentType
    );
    const descriptor = {
      documentType,
      label,
      uploaded: hasUploadedFile(payload[documentType]),
      fileCount: getFileCount(payload[documentType]),
      rejectionReason: getRejectionReason(payload[documentType]),
    };
    if (existingIndex >= 0) normalizedDocuments[existingIndex] = descriptor;
    else normalizedDocuments.push(descriptor);
  }

  const rawSummary = isRecord(payload.documentSummary)
    ? payload.documentSummary
    : {};
  const totalUploaded =
    typeof rawSummary.totalUploaded === "number"
      ? rawSummary.totalUploaded
      : typeof rawSummary.present === "number"
        ? rawSummary.present
        : normalizedDocuments.filter((document) => document.uploaded).length;

  return {
    ownerId: typeof payload.ownerId === "string" ? payload.ownerId : "",
    ownerCode: typeof payload.ownerCode === "string" ? payload.ownerCode : null,
    verificationStatus:
      typeof payload.verificationStatus === "string"
        ? payload.verificationStatus
        : "not_submitted",
    rejectionReason:
      typeof payload.rejectionReason === "string" ? payload.rejectionReason : null,
    documents: normalizedDocuments,
    documentSummary: {
      totalRequired:
        typeof rawSummary.totalRequired === "number"
          ? rawSummary.totalRequired
          : normalizedDocuments.length,
      totalUploaded,
      isComplete:
        typeof rawSummary.isComplete === "boolean"
          ? rawSummary.isComplete
          : normalizedDocuments.length > 0 && totalUploaded === normalizedDocuments.length,
    },
    submittedDetails: {
      panNumber:
        isRecord(payload.taxRegistration) && typeof payload.taxRegistration.panNumber === "string"
          ? payload.taxRegistration.panNumber
          : null,
      registrationNumber:
        isRecord(payload.taxRegistration) && typeof payload.taxRegistration.registrationNumber === "string"
          ? payload.taxRegistration.registrationNumber
          : null,
    },
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : null,
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : null,
  };
}
