import UploadCard from "../components/UploadCard";
import { inputClass } from "../components/FormField";
import type { FleetRegistrationDraft } from "../types";
import ExpiryDatePicker from "../components/ExpiryDatePicker";

export default function DocumentsStep({
  draft,
  update,
  readOnly = false,
  editableSlots,
}: {
  draft: FleetRegistrationDraft;
  update: (next: FleetRegistrationDraft) => void;
  readOnly?: boolean;
  editableSlots?: string[];
}) {
  const locked = (slot: string) => readOnly || (editableSlots ? !editableSlots.includes(slot) : false);
  const file = (key: keyof FleetRegistrationDraft["files"], files: File[]) =>
    update({ ...draft, files: { ...draft.files, [key]: files[0] || null } });

  const meta = (key: keyof FleetRegistrationDraft["documents"], value: string) =>
    update({ ...draft, documents: { ...draft.documents, [key]: value } });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UploadCard
        label="Fitness certificate"
        files={draft.files.fitnessCert ? [draft.files.fitnessCert] : []}
        onChange={locked("fitnessCert") ? () => {} : (f) => file("fitnessCert", f)}
        disabled={locked("fitnessCert")}
      >
        <ExpiryDatePicker label="Fitness expiry date" value={draft.documents.fitnessValidTill} onChange={(value) => meta("fitnessValidTill", value)} disabled={locked("fitnessCert")} />
      </UploadCard>

      <UploadCard
        label="Vehicle insurance"
        files={draft.files.insurance ? [draft.files.insurance] : []}
        onChange={locked("insurance") ? () => {} : (f) => file("insurance", f)}
        disabled={locked("insurance")}
      >
        <input
          aria-label="Insurance policy number"
          className={inputClass}
          placeholder="Policy number"
          value={draft.documents.insurancePolicyNumber}
          onChange={(e) => meta("insurancePolicyNumber", e.target.value)}
          disabled={locked("insurance")}
        />
        <ExpiryDatePicker label="Insurance expiry date" value={draft.documents.insuranceValidTill} onChange={(value) => meta("insuranceValidTill", value)} disabled={locked("insurance")} />
      </UploadCard>

      <UploadCard
        label="Bluebook"
        files={draft.files.bluebook ? [draft.files.bluebook] : []}
        onChange={locked("bluebook") ? () => {} : (f) => file("bluebook", f)}
        disabled={locked("bluebook")}
      />

      <UploadCard
        label="Route permit"
        files={draft.files.routePermit ? [draft.files.routePermit] : []}
        onChange={locked("routePermit") ? () => {} : (f) => file("routePermit", f)}
        disabled={locked("routePermit")}
      >
        <ExpiryDatePicker label="Route permit expiry date" value={draft.documents.routePermitValidTill} onChange={(value) => meta("routePermitValidTill", value)} disabled={locked("routePermit")} />
      </UploadCard>
    </div>
  );
}
