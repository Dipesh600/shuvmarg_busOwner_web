import UploadCard from "../components/UploadCard";
import { inputClass } from "../components/FormField";
import type { FleetRegistrationDraft } from "../types";

export default function DocumentsStep({
  draft,
  update,
  readOnly = false,
}: {
  draft: FleetRegistrationDraft;
  update: (next: FleetRegistrationDraft) => void;
  readOnly?: boolean;
}) {
  const file = (key: keyof FleetRegistrationDraft["files"], files: File[]) =>
    update({ ...draft, files: { ...draft.files, [key]: files[0] || null } });

  const meta = (key: keyof FleetRegistrationDraft["documents"], value: string) =>
    update({ ...draft, documents: { ...draft.documents, [key]: value } });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UploadCard
        label="Fitness certificate"
        files={draft.files.fitnessCert ? [draft.files.fitnessCert] : []}
        onChange={readOnly ? () => {} : (f) => file("fitnessCert", f)}
        disabled={readOnly}
      >
        <input
          aria-label="Fitness valid until"
          type="date"
          className={inputClass}
          value={draft.documents.fitnessValidTill}
          onChange={(e) => meta("fitnessValidTill", e.target.value)}
          disabled={readOnly}
        />
      </UploadCard>

      <UploadCard
        label="Vehicle insurance"
        files={draft.files.insurance ? [draft.files.insurance] : []}
        onChange={readOnly ? () => {} : (f) => file("insurance", f)}
        disabled={readOnly}
      >
        <input
          aria-label="Insurance policy number"
          className={inputClass}
          placeholder="Policy number"
          value={draft.documents.insurancePolicyNumber}
          onChange={(e) => meta("insurancePolicyNumber", e.target.value)}
          disabled={readOnly}
        />
        <input
          aria-label="Insurance valid until"
          type="date"
          className={inputClass}
          value={draft.documents.insuranceValidTill}
          onChange={(e) => meta("insuranceValidTill", e.target.value)}
          disabled={readOnly}
        />
      </UploadCard>

      <UploadCard
        label="Bluebook"
        files={draft.files.bluebook ? [draft.files.bluebook] : []}
        onChange={readOnly ? () => {} : (f) => file("bluebook", f)}
        disabled={readOnly}
      />

      <UploadCard
        label="Route permit"
        files={draft.files.routePermit ? [draft.files.routePermit] : []}
        onChange={readOnly ? () => {} : (f) => file("routePermit", f)}
        disabled={readOnly}
      >
        <input
          aria-label="Route permit valid until"
          type="date"
          className={inputClass}
          value={draft.documents.routePermitValidTill}
          onChange={(e) => meta("routePermitValidTill", e.target.value)}
          disabled={readOnly}
        />
      </UploadCard>
    </div>
  );
}
