"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  BUSINESS_FIELD_MAX_LENGTHS,
  type BusinessDraftFieldErrors,
  type BusinessVerificationDraft,
} from "@/features/operator-dashboard/business-verification-draft";
import { NEPAL_SETTLEMENT_INSTITUTION_GROUPS } from "@/features/operator-dashboard/nepal-settlement-institutions";

function inputClassName(): string {
  return "mt-1.5 h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3.5 text-sm font-semibold text-[#211D1A] outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10";
}

type DraftChange = (name: keyof BusinessVerificationDraft, value: string) => void;

export function Field({
  label, name, value, onChange, onValidate, error, autoComplete = "off",
  inputMode, optional = false, readOnly = false,
}: {
  label: string;
  name: keyof BusinessVerificationDraft;
  value: string;
  onChange: DraftChange;
  onValidate: DraftChange;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric";
  optional?: boolean;
  readOnly?: boolean;
}) {
  const errorId = `${name}-error`;
  return (
    <label className="block text-xs font-bold text-[#413B36]">
      {label}
      {optional ? <span className="ml-1 font-medium text-[#9A938D]">Optional</span> : <span className="ml-1 text-[#D96861]">*</span>}
      <input
        name={name} value={value} onChange={(event) => onChange(name, event.target.value)}
        onBlur={() => onValidate(name, value)} className={`${inputClassName()} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
        autoComplete={autoComplete} inputMode={inputMode} readOnly={readOnly}
        maxLength={BUSINESS_FIELD_MAX_LENGTHS[name]} aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <span id={errorId} className="mt-1.5 block text-[10px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export interface SearchableOption { name: string; group?: string }

export function SearchableSelectField({
  label, name, value, onChange, error, options, placeholder, disabled = false, onValidate,
}: {
  label: string;
  name: keyof BusinessVerificationDraft;
  value: string;
  onChange: DraftChange;
  error?: string;
  options: ReadonlyArray<SearchableOption>;
  placeholder: string;
  disabled?: boolean;
  onValidate: DraftChange;
}) {
  const listboxId = useId();
  const errorId = `${name}-error`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const filteredOptions = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? options.filter((option) => option.name.toLocaleLowerCase().includes(search)) : options;
  }, [options, query]);

  const selectOption = (option: SearchableOption) => {
    onChange(name, option.name); setQuery(option.name); setIsOpen(false); setActiveIndex(0);
  };
  const closeAndValidate = () => {
    const match = options.find((option) => option.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase());
    const next = match?.name || "";
    onChange(name, next); setQuery(next); onValidate(name, next); setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative block text-xs font-bold text-[#413B36]" onBlur={(event) => {
      if (!rootRef.current?.contains(event.relatedTarget as Node | null)) closeAndValidate();
    }}>
      <label htmlFor={`${listboxId}-input`}>{label}<span className="ml-1 text-[#D96861]">*</span></label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 h-3.5 w-3.5 -translate-y-1/2 text-[#9B938D]" />
        <input
          id={`${listboxId}-input`} name={name} value={isOpen ? query : value} disabled={disabled}
          placeholder={placeholder} autoComplete="off" role="combobox" aria-autocomplete="list"
          aria-expanded={isOpen} aria-controls={listboxId} aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClassName()} pl-9 pr-9 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} disabled:cursor-not-allowed disabled:bg-[#F5F1EE] disabled:text-[#A39B95]`}
          onFocus={() => { if (!disabled) { setQuery(value); setIsOpen(true); } }}
          onChange={(event) => { setQuery(event.target.value); onChange(name, ""); setIsOpen(true); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setIsOpen(true); setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0))); }
            else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
            else if (event.key === "Enter" && isOpen && filteredOptions[activeIndex]) { event.preventDefault(); selectOption(filteredOptions[activeIndex]); }
            else if (event.key === "Escape") { event.stopPropagation(); setQuery(value); setIsOpen(false); }
          }}
        />
        <ChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-[#7A716B] transition ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && !disabled && (
        <div id={listboxId} role="listbox" className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[#DED7D1] bg-white p-1.5 shadow-[0_16px_40px_rgba(72,44,35,0.16)]">
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
            <button key={`${option.group || "option"}-${option.name}`} type="button" role="option" aria-selected={option.name === value}
              onMouseDown={(event) => { event.preventDefault(); selectOption(option); }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${index === activeIndex ? "bg-[#FFF1EE] text-[#7A1D1B]" : "text-[#39332F] hover:bg-[#FAF6F3]"}`}>
              <span className="min-w-0"><span className="block truncate text-xs font-semibold">{option.name}</span>{option.group && <span className="mt-0.5 block text-[9px] font-semibold text-[#9A928C]">{option.group}</span>}</span>
              {option.name === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          )) : <div className="px-3 py-4 text-center text-[11px] font-semibold text-[#8D857F]">No matching option. Check the spelling and try again.</div>}
        </div>
      )}
      {error && <span id={errorId} className="mt-1.5 block text-[10px] font-semibold text-red-600">{error}</span>}
    </div>
  );
}

export function BankSelectField({ value, onChange, error, onValidate }: { value: string; onChange: DraftChange; error?: string; onValidate: DraftChange }) {
  return <SearchableSelectField label="Bank name" name="bankName" value={value} onChange={onChange} onValidate={onValidate} error={error} placeholder="Search licensed institution" options={NEPAL_SETTLEMENT_INSTITUTION_GROUPS.flatMap((group) => group.institutions.map((name) => ({ name, group: group.category })))} />;
}

export function ToleWardFields({ draft, errors, onChange, onValidate }: { draft: BusinessVerificationDraft; errors: BusinessDraftFieldErrors; onChange: DraftChange; onValidate: DraftChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold text-[#413B36]">Tole and ward<span className="ml-1 text-[#D96861]">*</span></legend>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_88px] gap-2">
        <input aria-label="Tole or locality" name="registeredTole" value={draft.registeredTole} placeholder="Tole / locality" autoComplete="address-line1" maxLength={BUSINESS_FIELD_MAX_LENGTHS.registeredTole} onChange={(event) => onChange("registeredTole", event.target.value)} onBlur={() => onValidate("registeredTole", draft.registeredTole)} className={`${inputClassName()} mt-0 ${errors.registeredTole ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`} aria-invalid={Boolean(errors.registeredTole)} />
        <input aria-label="Ward number" name="registeredWardNumber" value={draft.registeredWardNumber} placeholder="Ward" inputMode="numeric" maxLength={BUSINESS_FIELD_MAX_LENGTHS.registeredWardNumber} onChange={(event) => onChange("registeredWardNumber", event.target.value)} onBlur={() => onValidate("registeredWardNumber", draft.registeredWardNumber)} className={`${inputClassName()} mt-0 ${errors.registeredWardNumber ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`} aria-invalid={Boolean(errors.registeredWardNumber)} />
      </div>
      {(errors.registeredTole || errors.registeredWardNumber) && <span className="mt-1.5 block text-[10px] font-semibold text-red-600">{errors.registeredTole || errors.registeredWardNumber}</span>}
    </fieldset>
  );
}
