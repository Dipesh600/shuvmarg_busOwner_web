import type { BusinessVerificationDraft } from "./business-verification-draft";
import { normalizeNepalSettlementInstitutionName } from "./nepal-settlement-institutions";

const DATABASE_NAME = "shuvmarg-operator-drafts";
const DATABASE_VERSION = 1;
const FILE_STORE = "kyc-files";

export const KYC_DOCUMENT_FIELDS = [
  "companyRegistration",
  "taxRegistration",
  "transportLicense",
  "insuranceCertificates",
] as const;

export type KycDocumentField = (typeof KYC_DOCUMENT_FIELDS)[number];
export type KycDraftFiles = Partial<Record<KycDocumentField, File[]>>;

export function getBusinessDraftKey(ownerKey: string): string {
  return `shuvmarg:business-verification-draft:${ownerKey}`;
}

export function loadBusinessDraft(
  ownerKey: string
): Partial<BusinessVerificationDraft> | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(getBusinessDraftKey(ownerKey));
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<BusinessVerificationDraft> & {
      address?: string;
      registeredAddressLine1?: string;
      registeredAddressLine2?: string;
    };
    // Preserve device drafts created before registered addresses became structured.
    if (!parsed.registeredTole) {
      parsed.registeredTole = parsed.registeredAddressLine1 || parsed.address || "";
    }
    delete parsed.address;
    delete parsed.registeredAddressLine1;
    delete parsed.registeredAddressLine2;
    if (parsed.bankName) {
      parsed.bankName = normalizeNepalSettlementInstitutionName(parsed.bankName);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveBusinessDraft(
  ownerKey: string,
  draft: BusinessVerificationDraft
): void {
  window.localStorage.setItem(getBusinessDraftKey(ownerKey), JSON.stringify(draft));
}

export function clearBusinessDraft(ownerKey: string): void {
  window.localStorage.removeItem(getBusinessDraftKey(ownerKey));
}

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_STORE)) {
        database.createObjectStore(FILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fileKey(ownerKey: string, field: KycDocumentField): string {
  return `${ownerKey}:${field}`;
}

export async function loadDraftFiles(ownerKey: string): Promise<KycDraftFiles> {
  if (typeof window === "undefined" || !window.indexedDB) return {};
  const database = await openDraftDatabase();

  try {
    const entries = await Promise.all(
      KYC_DOCUMENT_FIELDS.map(
        (field) =>
          new Promise<[KycDocumentField, File[]]>((resolve, reject) => {
            const request = database
              .transaction(FILE_STORE, "readonly")
              .objectStore(FILE_STORE)
              .get(fileKey(ownerKey, field));
            request.onsuccess = () => resolve([field, request.result || []]);
            request.onerror = () => reject(request.error);
          })
      )
    );

    return Object.fromEntries(entries.filter(([, files]) => files.length > 0));
  } finally {
    database.close();
  }
}

export async function saveDraftFiles(
  ownerKey: string,
  field: KycDocumentField,
  files: File[]
): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  const database = await openDraftDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(FILE_STORE, "readwrite");
      const store = transaction.objectStore(FILE_STORE);
      if (files.length > 0) store.put(files, fileKey(ownerKey, field));
      else store.delete(fileKey(ownerKey, field));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function clearDraftFiles(ownerKey: string): Promise<void> {
  await Promise.all(
    KYC_DOCUMENT_FIELDS.map((field) => saveDraftFiles(ownerKey, field, []))
  );
}
