"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Truck,
  Shield,
  Phone,
  User,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { StaffRole, OperatorBrandOption } from "./staff-contract";
import { assignStaffMember } from "./staff-api";

interface AddCrewModalProps {
  isOpen: boolean;
  brands: OperatorBrandOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCrewModal({
  isOpen,
  brands,
  onClose,
  onSuccess,
}: AddCrewModalProps) {
  const [role, setRole] = useState<StaffRole>("driver");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseType, setLicenseType] = useState("B");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (brands.length > 0 && !brandId) {
      setBrandId(brands[0].id);
    }
  }, [brands, brandId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("Please provide a valid 10-digit mobile number.");
      return;
    }

    if (role === "driver" && !licenseNumber.trim()) {
      setErrorMsg("Driver license number is required for fleet compliance.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        role,
        name: name.trim(),
        phone: cleanPhone,
        brandId: brandId || brands[0]?.id || "",
        ...(role === "driver"
          ? {
              licenseNumber: licenseNumber.trim(),
              licenseType,
              licenseExpiry: licenseExpiry || undefined,
            }
          : {}),
      };

      const result = await assignStaffMember(payload);
      setSuccessMsg(result.message || "Crew member assigned and SMS invite sent.");

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to assign crew member. Please verify the phone number."
      );
    }
  };

  const handleClose = () => {
    setName("");
    setPhone("");
    setLicenseNumber("");
    setLicenseExpiry("");
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full flex flex-col border border-neutral-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-neutral-900">Add Crew Member</h3>
              <p className="text-[12px] text-neutral-500">
                Onboard verified drivers and conductors to your fleet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-[13px] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-[13px] font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role Selection Tabs */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Crew Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("driver")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  role === "driver"
                    ? "bg-blue-50/70 border-blue-300 text-blue-900 ring-2 ring-blue-600/10"
                    : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Truck className="w-5 h-5 text-blue-700 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold">Bus Driver</p>
                  <p className="text-[11px] text-neutral-500">Heavy vehicle pilot</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("conductor")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  role === "conductor"
                    ? "bg-amber-50/70 border-amber-300 text-amber-900 ring-2 ring-amber-600/10"
                    : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Shield className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold">Conductor</p>
                  <p className="text-[11px] text-neutral-500">Boarding &amp; tickets</p>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ram Bahadur Shrestha"
                className="w-full h-11 pl-11 pr-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[14px] font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Mobile Phone Number <span className="text-neutral-400 font-normal lowercase">(for SMS login)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                maxLength={10}
                className="w-full h-11 pl-11 pr-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[14px] font-mono font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Brand Assignment */}
          {brands.length > 1 && (
            <div>
              <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Assign to Fleet Brand
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-800 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Driver Compliance Fields */}
          {role === "driver" && (
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider">
                Driver License &amp; Compliance
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Driving License No.
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="01-06-XXXXXXXX"
                    className="w-full h-10 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[13px] font-mono font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    License Category
                  </label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-800 outline-none focus:border-[#7A1D1B] transition-all"
                  >
                    <option value="B">Category B (Heavy Bus)</option>
                    <option value="C">Category C (Medium / Minibus)</option>
                    <option value="F">Category F (Microbus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  License Expiry Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-800 outline-none focus:border-[#7A1D1B] transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMS Dispatch Notice */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[12px] text-neutral-600">
            <span>
              Upon submission, an SMS invitation containing a secure one-time temporary password will be sent directly to the registered phone number.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 px-4 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-[13px] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 h-10 px-5 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Assigning..." : "Assign Crew Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
