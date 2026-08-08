"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/auth";
import type { BusOwnerKycStatus, BusOwnerProfile } from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  calculateBusinessDraftProgress,
  BUSINESS_FIELDS,
  EMPTY_BUSINESS_VERIFICATION_DRAFT,
  formatRegisteredAddressPreview,
  getBusinessDraftFieldError,
  SETTLEMENT_FIELDS,
  validateBusinessDraftFields,
  type BusinessDraftFieldErrors,
  type BusinessDraftProgress,
  type BusinessVerificationDraft,
} from "@/features/operator-dashboard/business-verification-draft";
import {
  clearBusinessDraft,
  clearDraftFiles,
  loadBusinessDraft,
  loadDraftFiles,
  saveBusinessDraft,
  saveDraftFiles,
  type KycDocumentField,
  type KycDraftFiles,
} from "@/features/operator-dashboard/business-verification-draft-storage";
import { validateKycDraftFile } from "@/features/operator-dashboard/kyc-document-client-validation";
import { NEPAL_ADMINISTRATIVE_DIVISIONS } from "@/features/operator-dashboard/nepal-administrative-divisions";
import { normalizeNepalSettlementInstitutionName } from "@/features/operator-dashboard/nepal-settlement-institutions";
import {
  BankSelectField,
  Field,
  SearchableSelectField,
  ToleWardFields,
} from "./business-setup-modal/BusinessSetupFormControls";
import {
  DocumentPicker,
  ReviewDocumentPreview,
} from "./business-setup-modal/BusinessSetupDocumentControls";
import {
  BUSINESS_SETUP_DOCUMENTS as DOCUMENTS,
  BUSINESS_SETUP_STEPS as STEPS,
  BUSINESS_SETUP_TEXT_FIELDS as TEXT_FIELD_NAMES,
} from "./business-setup-modal/BusinessSetupModalConfig";
import BusinessApplicationReview from "./business-setup-modal/BusinessApplicationReview";

interface BusinessSetupModalProps {
  isOpen: boolean;
  initialStep: 0 | 1 | 2 | 3;
  profile: BusOwnerProfile;
  kycStatus?: BusOwnerKycStatus | null;
  ownerKey: string;
  onClose: () => void;
  onProgressChange: (progress: BusinessDraftProgress) => void;
  onSubmitted: () => void;
}

async function sanitizeRestoredDraftFiles(savedFiles: KycDraftFiles): Promise<{
  files: KycDraftFiles;
  changedFields: KycDocumentField[];
}> {
  const files: KycDraftFiles = {};
  const changedFields: KycDocumentField[] = [];

  await Promise.all(
    Object.entries(savedFiles).map(async ([rawField, selected]) => {
      const field = rawField as KycDocumentField;
      const checks = await Promise.all(
        (selected || []).map(async (file) => ({
          file,
          error: await validateKycDraftFile(file),
        }))
      );
      const validFiles = checks.filter(({ error }) => !error).map(({ file }) => file);
      if (validFiles.length > 0) files[field] = validFiles;
      if (validFiles.length !== (selected || []).length) changedFields.push(field);
    })
  );

  return { files, changedFields };
}

export default function BusinessSetupModal({
  isOpen,
  initialStep,
  profile,
  kycStatus,
  ownerKey,
  onClose,
  onProgressChange,
  onSubmitted,
}: BusinessSetupModalProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(initialStep);
  const [draft, setDraft] = useState<BusinessVerificationDraft>(
    EMPTY_BUSINESS_VERIFICATION_DRAFT
  );
  const [files, setFiles] = useState<KycDraftFiles>({});
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submissionToast, setSubmissionToast] = useState("");
  const [fieldErrors, setFieldErrors] = useState<BusinessDraftFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProvince = useMemo(
    () => NEPAL_ADMINISTRATIVE_DIVISIONS.find((province) => province.name === draft.registeredProvince),
    [draft.registeredProvince]
  );
  const districtOptions = selectedProvince?.districts || [];
  const selectedDistrict = districtOptions.find(
    (district) => district.name === draft.registeredDistrict
  );
  const municipalityOptions = selectedDistrict?.municipalities || [];
  const addressPreview = useMemo(
    () => formatRegisteredAddressPreview(draft),
    [draft]
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    loadDraftFiles(ownerKey)
      .then(async (savedFiles) => {
        if (!active) return;
        const sanitizedFiles = await sanitizeRestoredDraftFiles(savedFiles);
        if (!active) return;
        const stored = loadBusinessDraft(ownerKey);
        setDraft({
          ...EMPTY_BUSINESS_VERIFICATION_DRAFT,
          companyName: profile?.business.companyName || "",
          ownerName: profile?.profile.name || "",
          panNumber: kycStatus?.submittedDetails?.panNumber || "",
          registrationNumber: kycStatus?.submittedDetails?.registrationNumber || "",
          registeredTole: profile?.business.registeredAddress?.tole || "",
          registeredWardNumber: profile?.business.registeredAddress?.wardNumber || "",
          registeredMunicipality: profile?.business.registeredAddress?.municipality || "",
          registeredDistrict: profile?.business.registeredAddress?.district || "",
          registeredProvince: profile?.business.registeredAddress?.province || "",
          bankName: normalizeNepalSettlementInstitutionName(profile?.bank.bankName || ""),
          accountHolderName: profile?.bank.accountHolderName || "",
          accountNumber: profile?.bank.accountNumber || "",
          branchName: profile?.bank.branchName || "",
          swiftCode: profile?.bank.swiftCode || "",
          ...stored,
          registeredPostalCode: "",
          registeredCountry: "Nepal",
          ...(stored?.bankName
            ? { bankName: normalizeNepalSettlementInstitutionName(stored.bankName) }
            : {}),
        });
        setFiles(sanitizedFiles.files);
        if (sanitizedFiles.changedFields.length > 0) {
          setError("A saved document draft failed validation and was removed. Please select it again.");
          await Promise.allSettled(
            sanitizedFiles.changedFields.map((field) =>
              saveDraftFiles(ownerKey, field, sanitizedFiles.files[field] || [])
            )
          );
        }
      })
      .catch(() => {
        if (!active) return;
        const stored = loadBusinessDraft(ownerKey);
        setDraft({
          ...EMPTY_BUSINESS_VERIFICATION_DRAFT,
          companyName: profile?.business.companyName || "",
          ownerName: profile?.profile.name || "",
          panNumber: kycStatus?.submittedDetails?.panNumber || "",
          registrationNumber: kycStatus?.submittedDetails?.registrationNumber || "",
          registeredTole: profile?.business.registeredAddress?.tole || "",
          registeredWardNumber: profile?.business.registeredAddress?.wardNumber || "",
          registeredMunicipality: profile?.business.registeredAddress?.municipality || "",
          registeredDistrict: profile?.business.registeredAddress?.district || "",
          registeredProvince: profile?.business.registeredAddress?.province || "",
          bankName: normalizeNepalSettlementInstitutionName(profile?.bank.bankName || ""),
          accountHolderName: profile?.bank.accountHolderName || "",
          accountNumber: profile?.bank.accountNumber || "",
          branchName: profile?.bank.branchName || "",
          swiftCode: profile?.bank.swiftCode || "",
          ...stored,
          registeredPostalCode: "",
          registeredCountry: "Nepal",
          ...(stored?.bankName
            ? { bankName: normalizeNepalSettlementInstitutionName(stored.bankName) }
            : {}),
        });
        setError("Document draft could not be restored on this device.");
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [isOpen, kycStatus, ownerKey, profile]);

  const retainedDocumentFields = useMemo(
    () =>
      (kycStatus?.documents || [])
        .filter((document) => document.uploaded && !document.rejectionReason)
        .map((document) => document.documentType),
    [kycStatus]
  );

  const progress = useMemo(
    () =>
      calculateBusinessDraftProgress(
        draft,
        Object.entries(files)
          .filter(([, selected]) => Boolean(selected?.length))
          .map(([field]) => field)
          .concat(retainedDocumentFields)
      ),
    [draft, files, retainedDocumentFields]
  );

  useEffect(() => {
    if (!hydrated) return;
    saveBusinessDraft(ownerKey, draft);
    onProgressChange(progress);
  }, [draft, hydrated, onProgressChange, ownerKey, progress]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!submissionToast) return;
    const timer = window.setTimeout(() => setSubmissionToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [submissionToast]);

  if (!isOpen) return null;

  const updateField = (
    name: keyof BusinessVerificationDraft,
    value: string
  ) => {
    const normalizedValue = name === "swiftCode" ? value.toUpperCase() : value;
    setDraft((current) => {
      const next = { ...current, [name]: normalizedValue };
      if (name === "registeredProvince") {
        next.registeredDistrict = "";
        next.registeredMunicipality = "";
      } else if (name === "registeredDistrict") {
        next.registeredMunicipality = "";
      }
      return next;
    });
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
  };

  const validateField = (
    name: keyof BusinessVerificationDraft,
    value: string
  ) => {
    const fieldError = getBusinessDraftFieldError(name, value);
    setFieldErrors((current) => ({
      ...current,
      [name]: fieldError || undefined,
    }));
  };

  const selectFiles = async (
    field: KycDocumentField,
    selectedFiles: File[]
  ) => {
    const limit = field === "insuranceCertificates" ? 5 : 1;
    if (selectedFiles.length > limit) {
      setError(`Select no more than ${limit} file${limit > 1 ? "s" : ""}.`);
      return;
    }
    const validationResults = await Promise.all(
      selectedFiles.map(validateKycDraftFile)
    );
    const invalid = validationResults.find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }

    setFiles((current) => ({ ...current, [field]: selectedFiles }));
    setError("");
    try {
      await saveDraftFiles(ownerKey, field, selectedFiles);
    } catch {
      setError("This document could not be saved as a device draft.");
    }
  };

  const removeFile = async (field: KycDocumentField, index: number) => {
    const nextFiles = (files[field] || []).filter((_, fileIndex) => fileIndex !== index);
    setFiles((current) => ({ ...current, [field]: nextFiles }));
    setError("");
    try {
      await saveDraftFiles(ownerKey, field, nextFiles);
    } catch {
      setError("The document was removed from this view but the device draft could not be updated.");
    }
  };

  const validateSelectedFiles = async (): Promise<string | null> => {
    const results = await Promise.all(
      Object.values(files).flatMap((selected) =>
        (selected || []).map(validateKycDraftFile)
      )
    );
    return results.find(Boolean) || null;
  };

  const goNext = async () => {
    if (step === 0) {
      const errors = validateBusinessDraftFields(draft, BUSINESS_FIELDS);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError(Object.values(errors)[0] || "Check your business details.");
        return;
      }
    }
    if (step === 1) {
      const errors = validateBusinessDraftFields(draft, SETTLEMENT_FIELDS);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError(Object.values(errors)[0] || "Check your settlement account.");
        return;
      }
    }
    if (step === 2 && !progress.documentsComplete) {
      setError("Add all three required documents to continue.");
      return;
    }
    if (step === 2) {
      const fileError = await validateSelectedFiles();
      if (fileError) {
        setError(fileError);
        return;
      }
    }
    setFieldErrors({});
    setError("");
    setStep((current) => Math.min(current + 1, 3) as 0 | 1 | 2 | 3);
  };

  const submit = async () => {
    if (progress.nextStep !== 3) {
      setStep(progress.nextStep);
      setError("Complete this section before submitting.");
      return;
    }

    const allFields = [...BUSINESS_FIELDS, ...SETTLEMENT_FIELDS, "swiftCode"] as Array<
      keyof BusinessVerificationDraft
    >;
    const errors = validateBusinessDraftFields(draft, allFields);
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0] as keyof BusinessVerificationDraft;
      setFieldErrors(errors);
      setStep(BUSINESS_FIELDS.includes(firstField) ? 0 : 1);
      setError(errors[firstField] || "Check your application details.");
      return;
    }
    const fileError = await validateSelectedFiles();
    if (fileError) {
      setStep(2);
      setError(fileError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSubmissionToast("");
    try {
      const payload = new FormData();
      Object.entries(draft).forEach(([field, value]) => {
        if (value.trim()) payload.append(field, value.trim());
      });
      Object.entries(files).forEach(([field, selected]) => {
        selected?.forEach((file) => payload.append(field, file));
      });

      const response = await authFetch("/busowner/submitBusOwnerKyc", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        field?: string;
      } | null;
      if (!response.ok) {
        if (result?.field && TEXT_FIELD_NAMES.has(result.field)) {
          const textField = result.field as keyof BusinessVerificationDraft;
          setFieldErrors({ [textField]: result.message || "Check this field." });
          setStep(BUSINESS_FIELDS.includes(textField) ? 0 : 1);
          setError(result.message || "Check this field.");
          return;
        } else if (result?.field) {
          setStep(2);
          setError(result.message || "Check the selected document and try again.");
          return;
        }
        throw new Error(result?.message || "Submission failed. Check your details and try again.");
      }

      clearBusinessDraft(ownerKey);
      await clearDraftFiles(ownerKey);
      onSubmitted();
      onClose();
    } catch {
      setSubmissionToast("Please try again. Your application has not been submitted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1A1210]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-setup-title"
    >
      {submissionToast && (
        <div
          className="fixed right-4 top-4 z-[220] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-[#E7D5CE] bg-white p-4 text-[#271D19] shadow-[0_18px_50px_rgba(50,30,24,0.2)] sm:right-6 sm:top-6"
          role="alert"
          aria-live="assertive"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0EC] text-sm font-black text-[#9A2824]">
            !
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Something went wrong</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#706761]">
              {submissionToast}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionToast("")}
            className="rounded-lg p-1 text-[#81766F] transition hover:bg-[#F7F1EE] hover:text-[#4B3C36]"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex h-[94svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-[#E5DDD7] bg-[#FFFCFA] shadow-2xl sm:h-[760px] sm:max-h-[94svh] sm:rounded-[28px]">
        <header className="flex items-start justify-between gap-4 border-b border-[#EAE3DD] bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">
              Business verification
            </div>
            <h2
              id="business-setup-title"
              className="mt-1 font-display text-xl font-bold text-[#191512]"
            >
              {kycStatus?.verificationStatus === "rejected" ? "Update your application" : "Prepare your application"}
            </h2>
            <p className="mt-1 text-[11px] font-medium text-[#7B746E]">
              {kycStatus?.verificationStatus === "rejected"
                ? "Your saved details are restored. Change only the items marked for update."
                : "Drafts stay on this device. Nothing is submitted until the final step."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#E6DED8] bg-white p-2 text-[#6D655F] transition hover:bg-[#F8F5F2] disabled:opacity-50"
            aria-label="Close business setup"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-4 border-b border-[#EAE3DD] bg-[#FAF7F4] px-3 sm:px-7">
          {STEPS.map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index as 0 | 1 | 2 | 3)}
              className={`flex items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-[10px] font-bold transition sm:text-xs ${
                step === index
                  ? "border-[#7A1D1B] text-[#7A1D1B]"
                  : "border-transparent text-[#8D857F] hover:text-[#514A45]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{label}</span>
              <span className="xs:hidden">{index + 1}</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-[#211D1A]">
                  Business details
                </h3>
                <p className="mt-1 text-xs text-[#7B746E]">
                  Use the information shown on your registration documents.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal company name" name="companyName" value={draft.companyName} onChange={updateField} onValidate={validateField} error={fieldErrors.companyName} autoComplete="organization" />
                <Field label="Owner name" name="ownerName" value={draft.ownerName} onChange={updateField} onValidate={validateField} error={fieldErrors.ownerName} autoComplete="name" />
                <Field label="PAN / VAT number" name="panNumber" value={draft.panNumber} onChange={updateField} onValidate={validateField} error={fieldErrors.panNumber} inputMode="numeric" />
                <Field label="Registration number" name="registrationNumber" value={draft.registrationNumber} onChange={updateField} onValidate={validateField} error={fieldErrors.registrationNumber} />
                <SearchableSelectField label="Province" name="registeredProvince" value={draft.registeredProvince} onChange={updateField} onValidate={validateField} error={fieldErrors.registeredProvince} options={NEPAL_ADMINISTRATIVE_DIVISIONS} placeholder="Search province" />
                <SearchableSelectField label="District" name="registeredDistrict" value={draft.registeredDistrict} onChange={updateField} onValidate={validateField} error={fieldErrors.registeredDistrict} options={districtOptions} placeholder={draft.registeredProvince ? "Search district" : "Select province first"} disabled={!draft.registeredProvince} />
                <SearchableSelectField label="Municipality / rural municipality" name="registeredMunicipality" value={draft.registeredMunicipality} onChange={updateField} onValidate={validateField} error={fieldErrors.registeredMunicipality} options={municipalityOptions} placeholder={draft.registeredDistrict ? "Search municipality" : "Select district first"} disabled={!draft.registeredDistrict} />
                <ToleWardFields draft={draft} errors={fieldErrors} onChange={updateField} onValidate={validateField} />
                <div className="sm:col-span-2 rounded-2xl border border-[#E4D8D1] bg-[#FFF8F5] px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#7A1D1B] shadow-sm">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9B5A50]">Registered address preview</div>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-[#332B27]">{addressPreview}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-[#211D1A]">
                  Settlement account
                </h3>
                <p className="mt-1 text-xs text-[#7B746E]">
                  Ticket revenue will be settled to this account after approval.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <BankSelectField value={draft.bankName} onChange={updateField} onValidate={validateField} error={fieldErrors.bankName} />
                <Field label="Account holder name" name="accountHolderName" value={draft.accountHolderName} onChange={updateField} onValidate={validateField} error={fieldErrors.accountHolderName} autoComplete="name" />
                <Field label="Account number" name="accountNumber" value={draft.accountNumber} onChange={updateField} onValidate={validateField} error={fieldErrors.accountNumber} />
                <Field label="Branch name" name="branchName" value={draft.branchName} onChange={updateField} onValidate={validateField} error={fieldErrors.branchName} />
                <Field label="SWIFT code" name="swiftCode" value={draft.swiftCode} onChange={updateField} onValidate={validateField} error={fieldErrors.swiftCode} optional />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-[#211D1A]">
                  Documents
                </h3>
                <p className="mt-1 text-xs text-[#7B746E]">
                  Select clear originals and confirm each preview before continuing.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#E4D5CF] bg-[#FFF7F4] p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1D1B]" />
                <div>
                  <p className="text-[11px] font-bold text-[#493B35]">Files shown here are device drafts—not completed uploads.</p>
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#806F67]">They are uploaded only when you submit. The server independently checks file type and content, scans for malware, and keeps files quarantined until they are safe for review.</p>
                </div>
              </div>
              <div className="grid items-stretch gap-3 md:grid-cols-2">
                {DOCUMENTS.map((document) => (
                  <DocumentPicker
                    key={document.field}
                    {...document}
                    files={files[document.field] || []}
                    existingDocument={kycStatus?.documents?.find((item) => item.documentType === document.field)}
                    onSelect={selectFiles}
                    onRemove={removeFile}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-[#211D1A]">
                  Review and submit
                </h3>
                <p className="mt-1 text-xs text-[#7B746E]">
                  Check every value against the documents before sending it for review.
                </p>
              </div>
              <BusinessApplicationReview
                data={{
                  companyName: draft.companyName,
                  ownerName: draft.ownerName,
                  panNumber: draft.panNumber,
                  registrationNumber: draft.registrationNumber,
                  registeredAddress: addressPreview,
                  bankName: draft.bankName,
                  accountHolderName: draft.accountHolderName,
                  accountNumber: draft.accountNumber,
                  branchName: draft.branchName,
                  swiftCode: draft.swiftCode,
                }}
                documentsTitle="Documents ready to submit"
                onEditBusiness={() => setStep(0)}
                onEditSettlement={() => setStep(1)}
                onEditDocuments={() => setStep(2)}
                documents={
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {DOCUMENTS.map((document) => {
                        const localFiles = files[document.field] || [];
                        if (localFiles.length > 0) {
                          return localFiles.map((file, index) => (
                            <ReviewDocumentPreview key={`${document.field}-${file.name}-${index}`} file={file} />
                          ));
                        }
                        const existing = kycStatus?.documents?.find((item) => item.documentType === document.field);
                        return existing?.uploaded && !existing.rejectionReason ? (
                          <div key={document.field} className="flex h-32 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 text-center">
                            <FileText className="h-7 w-7 text-emerald-700" />
                            <div className="mt-2 text-[9px] font-bold text-emerald-800">{document.label}</div>
                            <div className="mt-1 text-[8px] font-semibold text-emerald-700">Previously submitted file retained</div>
                          </div>
                        ) : null;
                      })}
                  </div>
                }
              />
              <div className="flex items-start gap-3 rounded-2xl border border-[#E4D5CF] bg-[#FFF5F2] p-4 text-xs font-semibold leading-relaxed text-[#5D4038]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{kycStatus?.verificationStatus === "rejected" ? "Resubmitting keeps accepted documents and replaces only the updates selected here." : "Submitting sends these details and files once for security checks and compliance review. You will see “Under review” only after the server accepts the application."}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700" role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#EAE3DD] bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((step - 1) as 0 | 1 | 2))}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DED7D1] bg-white px-4 py-2.5 text-xs font-bold text-[#514A45] transition hover:bg-[#F8F5F2] disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 0 ? "Save and close" : "Back"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5C1414]"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting || progress.nextStep !== 3}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5C1414] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {kycStatus?.verificationStatus === "rejected" ? "Resubmit for review" : "Submit for review"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
