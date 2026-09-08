"use client";

import { useEffect, useState } from "react";
import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import { assignCrew, type CrewAssignmentResult, type CrewInput } from "@/features/crew-management/api";
import type { StaffMember, StaffRole } from "./staff-contract";

interface Props {
  brands: OperatorBrand[]; initialRole: StaffRole; existing?: StaffMember | null; resend?: boolean;
  onClose: () => void; onSaved: (message: string, warning: boolean, result: CrewAssignmentResult) => void;
}

type DriverStep = "details" | "documents";
const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10";
const allowedLicenseTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);

export default function CrewAssignmentDialog({ brands, initialRole, existing, resend = false, onClose, onSaved }: Props) {
  const role: StaffRole = existing?.role || initialRole;
  const needsSecurityRefresh = role === "driver" && Boolean(existing)
    && existing?.approvalStatus === "PENDING" && !resend;
  const [step, setStep] = useState<DriverStep>("details");
  const [brandId, setBrandId] = useState(existing?.brandId || brands[0]?.id || "");
  const [name, setName] = useState(existing?.fullName || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [gender, setGender] = useState<"" | "male" | "female" | "other">(existing?.gender || "");
  const [experienceYears, setExperienceYears] = useState(existing?.experienceYears || 0);
  const [licenseNumber, setLicenseNumber] = useState(existing?.licenseNumber || "");
  const [licenseType, setLicenseType] = useState<"HV" | "LV" | "TRK">(existing?.licenseType === "LV" || existing?.licenseType === "TRK" ? existing.licenseType : "HV");
  const [licenseExpiry, setLicenseExpiry] = useState(existing?.licenseExpiry?.slice(0, 10) || "");
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busy, onClose]);

  const validIdentity = Boolean(brandId && name.trim().length >= 3
    && /^((\+?977)|0)?9[78]\d{8}$/.test(phone.replace(/[\s()-]/g, "")));
  const validDriverDetails = role !== "driver" || ((resend || Boolean(gender))
    && Number.isInteger(experienceYears) && experienceYears >= 0 && experienceYears <= 80);
  const validDriverDocuments = role !== "driver" || Boolean(licenseNumber.trim() && licenseExpiry
    && (needsSecurityRefresh ? licenseDoc : existing || licenseDoc));

  const selectLicense = (file?: File) => {
    if (!file) return setLicenseDoc(null);
    if (!allowedLicenseTypes.has(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setLicenseDoc(null);
      return setError("Upload one JPG, PNG or PDF driving-license document up to 5 MB.");
    }
    setError(""); setLicenseDoc(file);
  };

  const submit = async () => {
    if (!validIdentity) return setError("Choose a brand and enter a name plus a valid Nepal mobile number.");
    if (!validDriverDetails) return setError("Choose the driver's gender and enter 0–80 years of experience.");
    if (!validDriverDocuments) return setError("Licence number, expiry and a licence document are required.");
    let payload: CrewInput;
    if (role === "driver") {
      payload = { role, brandId, name: name.trim(), phone: phone.trim(),
        gender: gender || "other", experienceYears, licenseNumber: licenseNumber.trim(),
        licenseType, licenseExpiry, ...(licenseDoc ? { licenseDoc } : {}), resendInvite: resend };
    } else payload = { role, brandId, name: name.trim(), phone: phone.trim(), resendInvite: resend };
    setBusy(true); setError("");
    try {
      const result = await assignCrew(payload);
      onSaved(result.message, result.data.notificationStatus === "FAILED", result.data);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };

  const title = resend ? `Retry ${role} invitation` : needsSecurityRefresh
    ? "Complete driver security check" : existing?.status === "INACTIVE"
      ? `Rehire ${role}` : `Add ${role}`;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="crew-dialog-title">
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-neutral-50 shadow-2xl">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-6 py-5">
        <div className="flex items-start justify-between"><div><h2 id="crew-dialog-title" className="text-xl font-bold capitalize text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{resend ? "Retry activation without creating another account." : `Create or connect this ${role}'s Partner app account.`}</p></div>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40" aria-label="Close"><X className="h-5 w-5" /></button></div>
        {role === "driver" && <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Driver form steps">
          <button type="button" role="tab" aria-selected={step === "details"} onClick={() => setStep("details")} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${step === "details" ? "bg-[#7A1D1B] text-white" : "bg-neutral-100 text-neutral-500"}`}>1. Details</button>
          <button type="button" role="tab" aria-selected={step === "documents"} onClick={() => setStep("documents")} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${step === "documents" ? "bg-[#7A1D1B] text-white" : "bg-neutral-100 text-neutral-500"}`}>2. Documents</button>
        </div>}
      </header>

      <div className="space-y-5 p-6">
        {(role !== "driver" || step === "details") && <>
          <label className="block text-xs font-bold text-neutral-700">Operator brand<select value={brandId} onChange={event => setBrandId(event.target.value)} disabled={Boolean(existing)} className={inputClass}>
            <option value="">Choose a brand</option>{brands.filter(brand => brand.status === "ACTIVE").map(brand => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}
          </select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-neutral-700">Full name<input value={name} onChange={event => setName(event.target.value)} disabled={Boolean(existing)} maxLength={100} autoComplete="name" className={inputClass} /></label>
            <label className="block text-xs font-bold text-neutral-700">Mobile number<input value={phone} onChange={event => setPhone(event.target.value)} disabled={Boolean(existing)} inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" className={inputClass} /></label>
            {role === "driver" && <><label className="block text-xs font-bold text-neutral-700">Gender<select value={gender} onChange={event => setGender(event.target.value as typeof gender)} disabled={resend} className={inputClass}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
              <label className="block text-xs font-bold text-neutral-700">Experience (years)<input type="number" min={0} max={80} step={1} value={experienceYears} onChange={event => setExperienceYears(Number(event.target.value))} disabled={resend} className={inputClass} /></label></>}
          </div>
        </>}

        {role === "driver" && step === "documents" && <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-bold text-neutral-900">Driving licence</p><p className="mt-1 text-xs text-neutral-500">The file is security-scanned and images are compressed before private storage. The driver becomes ready after these checks pass.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-neutral-700 sm:col-span-2">Licence number<input value={licenseNumber} onChange={event => setLicenseNumber(event.target.value.toUpperCase())} disabled={Boolean(existing)} maxLength={100} className={inputClass} /></label>
            <label className="block text-xs font-bold text-neutral-700">Licence type<select value={licenseType} onChange={event => setLicenseType(event.target.value as typeof licenseType)} disabled={Boolean(existing)} className={inputClass}><option value="HV">Heavy vehicle</option><option value="LV">Light vehicle</option><option value="TRK">Truck / articulated</option></select></label>
            <label className="block text-xs font-bold text-neutral-700">Valid until<input type="date" value={licenseExpiry} onChange={event => setLicenseExpiry(event.target.value)} disabled={Boolean(existing)} min={new Date().toISOString().slice(0, 10)} className={inputClass} /></label>
            {!resend && (!existing || needsSecurityRefresh) && <label className="block text-xs font-bold text-neutral-700 sm:col-span-2">Licence document
              <span className="mt-1.5 flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-sm font-semibold text-neutral-600 hover:border-[#7A1D1B]/50"><Upload className="h-5 w-5 text-[#7A1D1B]" />
                <span className="min-w-0 truncate">{licenseDoc ? licenseDoc.name : "Choose JPG, PNG or PDF (maximum 5 MB)"}</span></span>
              <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={event => selectLicense(event.target.files?.[0])} />
            </label>}
            {licenseDoc && <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 sm:col-span-2"><FileText className="h-4 w-4" />Ready for security checking and compression</div>}
          </div>
        </div>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
      </div>

      <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-200 bg-white px-6 py-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-700">Cancel</button>
        {role === "driver" && step === "details" ? <button type="button" disabled={busy} onClick={() => { if (!validIdentity || !validDriverDetails) setError("Complete the required driver details first."); else { setError(""); setStep("documents"); } }} className="rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Next: Documents</button>
          : <button type="button" disabled={busy} onClick={() => void submit()} className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{resend ? "Retry invitation" : needsSecurityRefresh ? "Run security checks" : existing?.status === "INACTIVE" ? "Rehire" : `Add ${role}`}</button>}</footer>
    </div>
  </div>;
}
