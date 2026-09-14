"use client";

import { FormEvent, useState } from "react";
import { BadgeCheck, Building2, Link2, LoaderCircle, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import { connectCrewIdentity, lookupCrewIdentity, type CrewAssignmentResult, type CrewIdentityPreview } from "@/features/crew-management/api";
import type { StaffRole } from "./staff-contract";

interface Props {
  role: StaffRole;
  brands: OperatorBrand[];
  initialBrandId?: string;
  onConnected: (message: string, warning: boolean, result: CrewAssignmentResult) => void;
}

const roleLabel = (role: StaffRole) => role === "driver" ? "Driver" : "Conductor";
const dateLabel = (value?: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "Not available";
const verificationLabel = (value?: string) => ({
  APPROVED: "Verified",
  PENDING: "Pending",
  REJECTED: "Needs attention",
}[value || ""] || "Pending");
const verificationTone = (value?: string) => value === "APPROVED"
  ? "bg-emerald-50 text-emerald-700"
  : value === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

export default function CrewIdentityLookup({ role, brands, initialBrandId, onConnected }: Props) {
  const activeBrands = brands.filter(brand => brand.status === "ACTIVE");
  const [identifier, setIdentifier] = useState("");
  const [brandId, setBrandId] = useState(() => {
    const requested = activeBrands.find(brand => brand.id === initialBrandId);
    return requested?.id || activeBrands[0]?.id || "";
  });
  const [preview, setPreview] = useState<CrewIdentityPreview | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [error, setError] = useState("");
  const label = roleLabel(role);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) return setError(`Enter a ${label} ID or mobile number.`);
    setLookupBusy(true); setError(""); setPreview(null);
    try { setPreview(await lookupCrewIdentity(role, identifier)); }
    catch (failure) { setError((failure as Error).message); }
    finally { setLookupBusy(false); }
  };

  const connect = async () => {
    if (!preview || !brandId || !preview.connectionEligibility.canConnect) return;
    setConnectBusy(true); setError("");
    try {
      const result = await connectCrewIdentity({ role, staffCode: preview.staffCode, brandId });
      onConnected(result.message, result.data.notificationStatus === "FAILED", result.data);
    } catch (failure) { setError((failure as Error).message); }
    finally { setConnectBusy(false); }
  };

  return <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]"><ShieldCheck className="size-5" /></span><div><h3 className="text-sm font-bold text-neutral-900">Check an existing {label.toLowerCase()} account</h3><p className="mt-0.5 text-xs text-neutral-500">Use their exact Shuvmarg ID or registered mobile.</p></div></div>

    <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label className="relative min-w-0 flex-1"><span className="sr-only">{label} ID or mobile number</span><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" /><input type="search" value={identifier} maxLength={40} onChange={event => { setIdentifier(event.target.value); setPreview(null); setError(""); }} placeholder={role === "driver" ? "SM-DR-… or 98XXXXXXXX" : "SM-CD-… or 98XXXXXXXX"} className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10" /></label>
      <button type="submit" disabled={lookupBusy || connectBusy} className="inline-flex h-11 min-w-24 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-sm font-bold text-white transition hover:bg-[#5C1414] disabled:opacity-50">{lookupBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}Check</button>
    </form>

    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p>}

    {preview && <div className="mt-4 space-y-4 rounded-2xl border border-[#E7DAD5] bg-[#FFFCFA] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-base font-bold text-neutral-900">{preview.fullName}</p><p className="mt-0.5 font-mono text-xs font-bold text-[#7A1D1B]">{preview.staffCode}</p></div>{role === "driver" && <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${verificationTone(preview.verificationStatus)}`}><BadgeCheck className="size-3.5" />{verificationLabel(preview.verificationStatus)}</span>}</div>
      {preview.phone && <p className="mt-3 text-xs font-semibold text-neutral-600">{preview.phone}</p>}
      {role === "driver" && <dl className="grid grid-cols-2 gap-3 border-t border-[#E7DAD5] pt-3 text-xs sm:grid-cols-3"><div><dt className="text-neutral-500">Licence</dt><dd className="mt-0.5 font-bold text-neutral-800">{preview.license?.type || "—"}</dd></div><div><dt className="text-neutral-500">Valid until</dt><dd className="mt-0.5 font-bold text-neutral-800">{dateLabel(preview.license?.expiresOn)}</dd></div><div><dt className="text-neutral-500">Experience</dt><dd className="mt-0.5 font-bold text-neutral-800">{preview.experienceYears || 0} years</dd></div></dl>}

      {preview.connectionEligibility.canConnect ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800"><span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4" />Identity is eligible to connect</span></div>
        : <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900"><span className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{preview.connectionEligibility.reason}</span></div>}

      <div className="border-t border-[#E7DAD5] pt-4">
        <label className="block text-xs font-bold text-neutral-700"><span className="inline-flex items-center gap-1.5"><Building2 className="size-4 text-[#7A1D1B]" />Connect to operator brand</span><select value={brandId} onChange={event => setBrandId(event.target.value)} disabled={connectBusy} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10"><option value="">Choose a brand</option>{activeBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select></label>
        <p className="mt-3 text-xs leading-5 text-neutral-600"><strong className="text-neutral-800">Access only:</strong> this sends a connection request. It does not assign this person to a bus or trip.</p>
        <button type="button" onClick={() => void connect()} disabled={connectBusy || !brandId || !preview.connectionEligibility.canConnect} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-sm font-bold text-white transition hover:bg-[#5C1414] disabled:cursor-not-allowed disabled:bg-neutral-300">{connectBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}Connect to brand</button>
      </div>
    </div>}
  </section>;
}
