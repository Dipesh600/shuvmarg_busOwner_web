import UploadCard from "../components/UploadCard";
import type { FleetRegistrationDraft } from "../types";

export default function VehiclePhotosStep({
  draft,
  update,
  readOnly = false,
}: {
  draft: FleetRegistrationDraft;
  update: (next: FleetRegistrationDraft) => void;
  readOnly?: boolean;
}) {
  const set = (key: keyof FleetRegistrationDraft["files"]["photos"], files: File[]) =>
    update({
      ...draft,
      files: {
        ...draft.files,
        photos: {
          ...draft.files.photos,
          [key]: files[0] || null,
        },
      },
    });

  const card = (label: string, description: string, key: keyof FleetRegistrationDraft["files"]["photos"]) => (
    <UploadCard
      label={label}
      description={description}
      files={draft.files.photos[key] ? [draft.files.photos[key]!] : []}
      accept="image/jpeg,image/png,image/webp"
      onChange={readOnly ? () => {} : (files) => set(key, files)}
      disabled={readOnly}
    />
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-black text-[#211D1A]">Bus photos</h4>
        <p className="mt-1 text-xs text-[#746E69]">
          {readOnly
            ? "Photos submitted with this bus for review."
            : "Upload clear photos of your bus. These help passengers recognize it before boarding."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {card("Front View", "Windshield & front license plate", "front")}
        {card("Rear View", "Rear view with bus number", "rear")}
        {card("Side Profile", "Exterior side livery & windows", "side")}
        {card("Interior Cabin", "Passenger seats & central aisle", "cabin")}
      </div>
    </div>
  );
}
