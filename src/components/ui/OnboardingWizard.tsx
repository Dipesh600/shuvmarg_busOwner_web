"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { store } from "@/lib/store";

const basicSchema = z.object({
  operatorName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  operatingCity: z.string().min(2, "City is required"),
  fleetSize: z.string().min(1, "Select fleet size"),
});
type BasicFormData = z.infer<typeof basicSchema>;

const FLEET_SIZES = [
  { value: "1-5 Buses", icon: "directions_bus", desc: "Solo operator" },
  { value: "6-20 Buses", icon: "directions_bus", desc: "Small fleet" },
  { value: "21+ Buses", icon: "directions_bus", desc: "Large operator" },
];
const STEPS = ["Operator Details", "Company & Bank", "Documents", "Success"];

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
}

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="form-label">
        {label}{" "}
        {required && <span className="text-maroon">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        className={`form-input ${error ? "error" : ""}`}
      />
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}

interface FileUploadItemProps {
  label: string;
  fieldName: string;
  icon: string;
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => void;
  onFileRemove: (fieldName: string) => void;
}

function FileUploadItem({
  label,
  fieldName,
  icon,
  file,
  onFileChange,
  onFileRemove,
}: FileUploadItemProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => !file && ref.current?.click()}
      className={`relative rounded-xl p-4 border-2 border-dashed flex items-center justify-between gap-4 transition-all duration-200 ${
        file
          ? "border-maroon bg-[rgba(122,29,27,0.04)] cursor-default"
          : "border-neutral-200 bg-white hover:border-maroon hover:bg-[rgba(122,29,27,0.02)] cursor-pointer"
      }`}
    >
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => onFileChange(e, fieldName)}
      />

      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            file ? "bg-[rgba(122,29,27,0.1)]" : "bg-ivory border border-neutral-200"
          }`}
        >
          <span
            className={`material-symbols-rounded text-[20px] ${
              file ? "text-maroon" : "text-neutral-400"
            }`}
          >
            {icon}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-neutral-900 truncate">{label}</span>
          {file ? (
            <span className="text-xs text-neutral-500 truncate">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          ) : (
            <span className="text-xs text-neutral-400">
              PDF, JPG up to 5 MB
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {file ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileRemove(fieldName);
            }}
            className="w-8 h-8 rounded-full hover:bg-[rgba(211,47,47,0.1)] text-neutral-400 hover:text-danger flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-rounded text-[18px]">delete</span>
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center">
            <span className="material-symbols-rounded text-neutral-400 text-[18px]">add</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullData, setFullData] = useState<Record<string, string>>({});

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    companyRegistrationCert: null,
    panCardImage: null,
    ownerCitizenship: null,
    bankAuthorizationLetter: null,
  });

  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    setValue: setBasicValue,
    control: basicControl,
    formState: { errors: basicErrors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
    defaultValues: { operatingCity: "", fleetSize: "1-5 Buses" },
  });

  const currentFleetSize = useWatch({
    control: basicControl,
    name: "fleetSize",
  });

  // Sync state to the global store for the Navbar
  useEffect(() => {
    store.setState({
      onboardingStep: step,
      onboardingTitle: STEPS[step] || "Success"
    });
  }, [step]);

  const onBasicSubmit = (data: BasicFormData) => {
    setFullData((prev) => ({
      ...prev,
      companyName: data.operatorName,
      ownerName: data.contactName,
      address: data.operatingCity,
    }));
    setStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFullData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const handleFileRemove = (fieldName: string) => {
    setFiles((prev) => ({ ...prev, [fieldName]: null }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const finalSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep(3);
  };

  return (
    <div className="w-full max-w-[820px] mx-auto mt-8 mb-24">
      {/* ── Step Progress Bar ──────────────────────────────────────── */}
      <div className="mb-10 px-2">
        <div className="flex items-center gap-0">
          {STEPS.slice(0, -1).map((s, i) => {
            const isComplete = step > i;
            const isActive = step === i;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                      isComplete
                        ? "bg-maroon border-maroon text-white"
                        : isActive
                        ? "bg-white border-maroon text-maroon shadow-[0_0_0_4px_rgba(122,29,27,0.12)]"
                        : "bg-white border-neutral-200 text-neutral-400"
                    }`}
                  >
                    {isComplete ? (
                      <span className="material-symbols-rounded text-[18px]">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-2 whitespace-nowrap ${
                      isActive ? "text-maroon" : isComplete ? "text-neutral-700" : "text-neutral-400"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {/* Connector */}
                {i < STEPS.length - 2 && (
                  <div
                    className={`flex-1 h-[2px] mx-3 mb-5 rounded-full transition-all duration-500 ${
                      step > i ? "bg-maroon" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-md min-h-[480px]">
        {/* Gold top accent */}
        <div className="h-1 bg-gold rounded-t-2xl" />

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {/* ── STEP 0: Operator Details ─────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <span className="eyebrow">Step 1 of 3</span>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                    Operator Profile
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Tell us about your company and your fleet.
                  </p>
                </div>

                <form onSubmit={handleSubmitBasic(onBasicSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">
                        Operator / Company Name <span className="text-maroon">*</span>
                      </label>
                      <input
                        {...registerBasic("operatorName")}
                        placeholder="e.g. Shuvmarg Travels Pvt. Ltd."
                        className={`form-input ${basicErrors.operatorName ? "error" : ""}`}
                      />
                      {basicErrors.operatorName && (
                        <p className="text-xs text-danger mt-1.5">
                          {basicErrors.operatorName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">
                        Contact Person <span className="text-maroon">*</span>
                      </label>
                      <input
                        {...registerBasic("contactName")}
                        placeholder="Your full name"
                        className={`form-input ${basicErrors.contactName ? "error" : ""}`}
                      />
                      {basicErrors.contactName && (
                        <p className="text-xs text-danger mt-1.5">
                          {basicErrors.contactName.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="form-label">
                        Primary City / Region <span className="text-maroon">*</span>
                      </label>
                      <input
                        {...registerBasic("operatingCity")}
                        placeholder="e.g. Kathmandu, Nepal"
                        className={`form-input ${basicErrors.operatingCity ? "error" : ""}`}
                      />
                      {basicErrors.operatingCity && (
                        <p className="text-xs text-danger mt-1.5">
                          {basicErrors.operatingCity.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fleet size selector */}
                  <div>
                    <label className="form-label">
                      Total Fleet Size <span className="text-maroon">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {FLEET_SIZES.map(({ value, icon, desc }) => {
                        const isSelected = currentFleetSize === value;
                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setBasicValue("fleetSize", value, { shouldValidate: true })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-maroon bg-[rgba(122,29,27,0.04)] text-maroon"
                                : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <span
                              className={`material-symbols-rounded text-[24px] ${
                                isSelected ? "text-maroon" : "text-neutral-400"
                              }`}
                            >
                              {icon}
                            </span>
                            <span>{value}</span>
                            <span className={`text-[10px] font-normal ${isSelected ? "text-maroon/70" : "text-neutral-400"}`}>
                              {desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-100">
                    <button type="submit" className="btn-primary">
                      Save & Continue
                      <span className="material-symbols-rounded ml-1.5 text-[18px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 1: Company & Bank ────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <span className="eyebrow">Step 2 of 3</span>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                    Legal & Financial
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Required for compliance verification and automated payouts.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Company details group */}
                  <div className="p-5 bg-ivory rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-rounded text-maroon text-[18px]">business</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Company Details
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Company Legal Name"
                        name="companyName"
                        value={fullData.companyName}
                        onChange={handleInputChange}
                        required
                        placeholder="Registered company name"
                      />
                      <FormField
                        label="PAN / VAT Number"
                        name="panNumber"
                        value={fullData.panNumber}
                        onChange={handleInputChange}
                        required
                        placeholder="9-digit PAN"
                      />
                      <FormField
                        label="Registration Number"
                        name="registrationNumber"
                        value={fullData.registrationNumber}
                        onChange={handleInputChange}
                        required
                        placeholder="Company Reg. No."
                      />
                      <FormField
                        label="Registered Address"
                        name="address"
                        value={fullData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Full address"
                      />
                    </div>
                  </div>

                  {/* Bank details group */}
                  <div className="p-5 bg-ivory rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-rounded text-maroon text-[18px]">account_balance</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Payout Information
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Bank Name"
                        name="bankName"
                        value={fullData.bankName}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Rastriya Banijya Bank"
                      />
                      <FormField
                        label="Account Holder Name"
                        name="accountHolderName"
                        value={fullData.accountHolderName}
                        onChange={handleInputChange}
                        required
                        placeholder="As per bank records"
                      />
                      <FormField
                        label="Account Number"
                        name="accountNumber"
                        value={fullData.accountNumber}
                        onChange={handleInputChange}
                        required
                        placeholder="Bank account number"
                      />
                      <FormField
                        label="Branch Code"
                        name="swiftCode"
                        value={fullData.swiftCode}
                        onChange={handleInputChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-neutral-100">
                    <button onClick={handleBack} className="btn-secondary">
                      <span className="material-symbols-rounded mr-1.5 text-[18px]">arrow_back</span>
                      Back
                    </button>
                    <button onClick={handleNext} className="btn-primary">
                      Save & Continue
                      <span className="material-symbols-rounded ml-1.5 text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Documents ──────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <span className="eyebrow">Step 3 of 3</span>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                    Document Upload
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Attach clear copies of all required documents for verification.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <FileUploadItem
                    label="Company Registration Certificate"
                    fieldName="companyRegistrationCert"
                    icon="verified"
                    file={files.companyRegistrationCert}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                  <FileUploadItem
                    label="PAN Card Image"
                    fieldName="panCardImage"
                    icon="badge"
                    file={files.panCardImage}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                  <FileUploadItem
                    label="Owner Citizenship / ID"
                    fieldName="ownerCitizenship"
                    icon="id_card"
                    file={files.ownerCitizenship}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                  <FileUploadItem
                    label="Bank Authorization Letter"
                    fieldName="bankAuthorizationLetter"
                    icon="account_balance_wallet"
                    file={files.bankAuthorizationLetter}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-neutral-100">
                  <button onClick={handleBack} className="btn-secondary">
                    <span className="material-symbols-rounded mr-1.5 text-[18px]">arrow_back</span>
                    Back
                  </button>
                  <button
                    onClick={finalSubmit}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-rounded mr-1.5 text-[18px] animate-spin">
                          progress_activity
                        </span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded mr-1.5 text-[18px]">
                          cloud_upload
                        </span>
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Success ───────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-[rgba(122,29,27,0.08)] flex items-center justify-center mb-6">
                  <span className="material-symbols-rounded text-maroon text-[36px]">
                    check_circle
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Application Submitted
                </h2>
                <p className="text-neutral-500 text-base leading-relaxed mb-8 max-w-sm">
                  Your application is under review. Our partner team will contact you within 24–48
                  business hours to complete onboarding.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <Link href="/dashboard" className="flex-1">
                    <button className="btn-primary w-full">
                      Go to Dashboard
                      <span className="material-symbols-rounded ml-1.5 text-[18px]">arrow_forward</span>
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
