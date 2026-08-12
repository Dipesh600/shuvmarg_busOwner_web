"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  BusFront,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { registerFleetForVerification } from "@/features/operator-dashboard/operator-fleet-api";

interface FleetRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

const BUS_TYPES = ["DELUXE", "AC", "NON_AC", "SLEEPER", "SEMI_SLEEPER"];
const VEHICLE_TYPES = ["bus", "hiace", "minibus", "jeep"];

function toFiles(fileList: FileList | null): File[] {
  return fileList ? Array.from(fileList) : [];
}

export default function FleetRegistrationModal({
  open,
  onClose,
  onRegistered,
}: FleetRegistrationModalProps) {
  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busType, setBusType] = useState("DELUXE");
  const [vehicleType, setVehicleType] = useState("bus");
  const [totalSeats, setTotalSeats] = useState("");
  const [registrationYear, setRegistrationYear] = useState("");
  const [requestOriginCity, setRequestOriginCity] = useState("");
  const [requestDestinationCity, setRequestDestinationCity] = useState("");
  const [requestViaStops, setRequestViaStops] = useState("");

  const [fleetImages, setFleetImages] = useState<File[]>([]);
  const [fitnessCert, setFitnessCert] = useState<File | null>(null);
  const [fitnessCertValidTill, setFitnessCertValidTill] = useState("");
  const [insurance, setInsurance] = useState<File | null>(null);
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceValidTill, setInsuranceValidTill] = useState("");
  const [bluebook, setBluebook] = useState<File | null>(null);
  const [routePermit, setRoutePermit] = useState<File | null>(null);
  const [routePermitValidTill, setRoutePermitValidTill] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setBusName("");
    setBusNumber("");
    setBusType("DELUXE");
    setVehicleType("bus");
    setTotalSeats("");
    setRegistrationYear("");
    setRequestOriginCity("");
    setRequestDestinationCity("");
    setRequestViaStops("");
    setFleetImages([]);
    setFitnessCert(null);
    setFitnessCertValidTill("");
    setInsurance(null);
    setInsurancePolicyNumber("");
    setInsuranceValidTill("");
    setBluebook(null);
    setRoutePermit(null);
    setRoutePermitValidTill("");
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const validate = () => {
    if (!busName.trim() || !busNumber.trim() || !totalSeats.trim()) {
      return "Add bus name, plate number, and total seats.";
    }
    if (Number(totalSeats) <= 0) {
      return "Total seats must be greater than zero.";
    }
    if (fleetImages.length < 1 || fleetImages.length > 6) {
      return "Upload between 1 and 6 fleet photos.";
    }
    if (!fitnessCert || !insurance || !bluebook || !routePermit) {
      return "Upload fitness certificate, insurance, bluebook, and route permit.";
    }
    return null;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await registerFleetForVerification(
        {
          busName: busName.trim(),
          busNumber: busNumber.trim(),
          busType,
          vehicleType,
          totalSeats: Number(totalSeats),
          registrationYear: registrationYear.trim() || undefined,
          requestOriginCity: requestOriginCity.trim() || undefined,
          requestDestinationCity: requestDestinationCity.trim() || undefined,
          requestViaStops: requestViaStops
            .split(",")
            .map((stop) => stop.trim())
            .filter(Boolean),
        },
        {
          fleetImages,
          fitnessCert: fitnessCert as File,
          fitnessCertValidTill,
          insurance: insurance as File,
          insurancePolicyNumber,
          insuranceValidTill,
          bluebook: bluebook as File,
          routePermit: routePermit as File,
          routePermitValidTill,
        }
      );
      reset();
      onRegistered();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fleet registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#E8E1DB] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E1DB] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#7A1D1B]">
              <BusFront className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#191512]">
                Register fleet
              </h2>
              <p className="text-xs font-medium text-[#746E69]">
                Submit vehicle details and documents for review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E1DB] text-[#746E69] transition hover:bg-[#FAF8F5] disabled:opacity-50"
            aria-label="Close fleet registration"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-5 py-5 sm:px-6">
            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#211D1A]">
                <BusFront className="h-4 w-4 text-[#7A1D1B]" />
                Vehicle details
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bus name">
                  <input value={busName} onChange={(event) => setBusName(event.target.value)} className={inputClass} placeholder="Himalayan Express" />
                </Field>
                <Field label="Plate number">
                  <input value={busNumber} onChange={(event) => setBusNumber(event.target.value.toUpperCase())} className={inputClass} placeholder="BA 3 KHA 1234" />
                </Field>
                <Field label="Bus class">
                  <select value={busType} onChange={(event) => setBusType(event.target.value)} className={inputClass}>
                    {BUS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Vehicle type">
                  <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className={inputClass}>
                    {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Total seats">
                  <input type="number" min="1" value={totalSeats} onChange={(event) => setTotalSeats(event.target.value)} className={inputClass} placeholder="35" />
                </Field>
                <Field label="Registration year">
                  <input type="number" min="1980" value={registrationYear} onChange={(event) => setRegistrationYear(event.target.value)} className={inputClass} placeholder="2024" />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#211D1A]">
                <MapPin className="h-4 w-4 text-[#7A1D1B]" />
                Route request
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Origin city">
                  <input value={requestOriginCity} onChange={(event) => setRequestOriginCity(event.target.value)} className={inputClass} placeholder="Kathmandu" />
                </Field>
                <Field label="Destination city">
                  <input value={requestDestinationCity} onChange={(event) => setRequestDestinationCity(event.target.value)} className={inputClass} placeholder="Pokhara" />
                </Field>
              </div>
              <Field label="Via stops">
                <input value={requestViaStops} onChange={(event) => setRequestViaStops(event.target.value)} className={inputClass} placeholder="Muglin, Dumre" />
              </Field>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#211D1A]">
                <FileText className="h-4 w-4 text-[#7A1D1B]" />
                Documents
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField label="Fleet photos" count={fleetImages.length}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFleetImages(toFiles(event.target.files))} className={fileClass} />
                </FileField>
                <FileField label="Fitness certificate" count={fitnessCert ? 1 : 0}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFitnessCert(event.target.files?.[0] || null)} className={fileClass} />
                  <input type="date" value={fitnessCertValidTill} onChange={(event) => setFitnessCertValidTill(event.target.value)} className={`${inputClass} mt-2`} />
                </FileField>
                <FileField label="Insurance" count={insurance ? 1 : 0}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setInsurance(event.target.files?.[0] || null)} className={fileClass} />
                  <input value={insurancePolicyNumber} onChange={(event) => setInsurancePolicyNumber(event.target.value)} className={`${inputClass} mt-2`} placeholder="Policy number" />
                  <input type="date" value={insuranceValidTill} onChange={(event) => setInsuranceValidTill(event.target.value)} className={`${inputClass} mt-2`} />
                </FileField>
                <FileField label="Bluebook" count={bluebook ? 1 : 0}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setBluebook(event.target.files?.[0] || null)} className={fileClass} />
                </FileField>
                <FileField label="Route permit" count={routePermit ? 1 : 0}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setRoutePermit(event.target.files?.[0] || null)} className={fileClass} />
                  <input type="date" value={routePermitValidTill} onChange={(event) => setRoutePermitValidTill(event.target.value)} className={`${inputClass} mt-2`} />
                </FileField>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#E8E1DB] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#746E69]">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>Fleet moves to pending review after upload.</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={close} disabled={submitting} className="h-11 rounded-xl border border-[#E8E1DB] px-4 text-xs font-bold text-[#655E58] transition hover:bg-[#FAF8F5] disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-xs font-bold text-white transition hover:bg-[#5C1414] disabled:opacity-60">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{submitting ? "Submitting" : "Submit for review"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E8E1DB] bg-[#FAF8F5] px-3 text-sm font-semibold text-[#191512] outline-none transition focus:border-[#7A1D1B]";

const fileClass =
  "block w-full text-xs font-semibold text-[#655E58] file:mr-3 file:rounded-lg file:border-0 file:bg-[#7A1D1B] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817A74]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FileField({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817A74]">
          {label}
        </span>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#655E58]">
          {count ? `${count} selected` : "Required"}
        </span>
      </div>
      {children}
    </div>
  );
}
