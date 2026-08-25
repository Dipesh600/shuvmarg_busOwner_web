import { useState, useEffect, useCallback } from "react";
import FormField, { inputClass } from "../components/FormField";
import type { FleetRegistrationDraft } from "../types";
import { listMyBrands, type OperatorBrand } from "../api-brands";
import { listAvailableAmenities, type FleetAmenity } from "../api";

interface VehicleDetailsStepProps {
  draft: FleetRegistrationDraft;
  update: (
    next:
      | FleetRegistrationDraft
      | ((prev: FleetRegistrationDraft) => FleetRegistrationDraft)
  ) => void;
  readOnly?: boolean;
}

export default function VehicleDetailsStep({
  draft,
  update,
  readOnly = false,
}: VehicleDetailsStepProps) {
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(true);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<FleetAmenity[]>([]);
  const [amenityError, setAmenityError] = useState<string | null>(null);

  const applyDefaultBrandSelection = useCallback(
    (fetchedBrands: OperatorBrand[]) => {
      const defaultActive = fetchedBrands.find(
        (b) => b.isDefault && b.status === "ACTIVE"
      );
      const firstActive = fetchedBrands.find((b) => b.status === "ACTIVE");
      const target = defaultActive || firstActive;
      if (target) {
        update((prev) => {
          if (!prev.vehicle.brandId) {
            return {
              ...prev,
              vehicle: { ...prev.vehicle, brandId: target.id },
            };
          }
          return prev;
        });
      }
    },
    [update]
  );

  const loadBrands = useCallback(async () => {
    setLoadingBrands(true);
    setBrandError(null);
    try {
      const fetchedBrands = await listMyBrands();
      setBrands(fetchedBrands);
      applyDefaultBrandSelection(fetchedBrands);
    } catch (err) {
      setBrandError(
        err instanceof Error ? err.message : "Failed to load operator brands"
      );
    } finally {
      setLoadingBrands(false);
    }
  }, [applyDefaultBrandSelection]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoadingBrands(true);
      setBrandError(null);
      try {
        const fetchedBrands = await listMyBrands();
        if (!mounted) return;
        setBrands(fetchedBrands);
        applyDefaultBrandSelection(fetchedBrands);
      } catch (err) {
        if (!mounted) return;
        setBrandError(
          err instanceof Error ? err.message : "Failed to load operator brands"
        );
      } finally {
        if (mounted) setLoadingBrands(false);
      }
    }

    void init();
    return () => {
      mounted = false;
    };
  }, [applyDefaultBrandSelection]);

  useEffect(() => {
    let mounted = true;
    listAvailableAmenities()
      .then((items) => {
        if (!mounted) return;
        setAmenities(items);
        update((prev) => {
          const known = new Map([
            ...prev.vehicle.amenityDetails.map((item) => [item.id, item] as const),
            ...items.map((item) => [item.id, item] as const),
          ]);
          const amenityDetails = prev.vehicle.amenityIds.flatMap((id) => {
            const item = known.get(id);
            return item ? [item] : [];
          });
          return JSON.stringify(amenityDetails) === JSON.stringify(prev.vehicle.amenityDetails)
            ? prev
            : { ...prev, vehicle: { ...prev.vehicle, amenityDetails } };
        });
      })
      .catch((error) => { if (mounted) setAmenityError(error instanceof Error ? error.message : "Unable to load amenities"); });
    return () => { mounted = false; };
  }, [update]);

  const setField = (
    key: keyof FleetRegistrationDraft["vehicle"],
    value: string
  ) => {
    update((prev) => ({
      ...prev,
      vehicle: { ...prev.vehicle, [key]: value },
    }));
  };

  const activeBrands = brands.filter((b) => b.status === "ACTIVE");
  const amenityGroups = [
    { type: "GLOBAL" as const, label: "Platform amenities", hint: "Standard facilities available across Shuvmarg." },
    { type: "CUSTOM" as const, label: "Your amenities", hint: "Facilities created specifically for your operation." },
  ].map((group) => ({ ...group, items: amenities.filter((item) => item.type === group.type) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormField
          label="Operator Brand *"
          hint="This is the travel brand passengers will see."
        >
          {loadingBrands ? (
            <div className="mt-2 flex h-11 items-center rounded-xl border border-[#DCD4CD] bg-[#FAF7F2] px-3 text-xs text-[#817A74]">
              Loading operator brands...
            </div>
          ) : brandError ? (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <span>{brandError}</span>
              <button
                type="button"
                onClick={() => void loadBrands()}
                className="font-semibold underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          ) : activeBrands.length === 0 ? (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              No active operator brand is available. Complete business approval
              or contact Shuvmarg support before registering a fleet.
            </div>
          ) : (
            <select
              className={inputClass}
              value={draft.vehicle.brandId}
              onChange={(e) => setField("brandId", e.target.value)}
              required
              disabled={readOnly}
            >
              <option value="">Select an active operator brand...</option>
              {brands.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={item.status !== "ACTIVE"}
                >
                  {item.brandName}
                  {item.isDefault ? " (Default)" : ""}
                  {item.status !== "ACTIVE" ? ` (${item.status})` : ""}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <FormField label="Bus name *">
        <input
          className={inputClass}
          value={draft.vehicle.busName}
          onChange={(e) => setField("busName", e.target.value)}
          placeholder="Himalayan Express"
          required
          disabled={readOnly}
        />
      </FormField>

      <FormField label="Plate number *">
        <input
          className={inputClass}
          value={draft.vehicle.busNumber}
          onChange={(e) => setField("busNumber", e.target.value.toUpperCase())}
          placeholder="BA 3 KHA 1234"
          required
          disabled={readOnly}
        />
      </FormField>

      <FormField label="Service type *">
        <select
          className={inputClass}
          value={draft.vehicle.busType}
          onChange={(e) => setField("busType", e.target.value)}
          disabled={readOnly}
        >
          {["DELUXE", "AC", "NON_AC", "SLEEPER", "SEMI_SLEEPER"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Bus type *">
        <select
          className={inputClass}
          value={draft.vehicle.vehicleType}
          onChange={(e) => setField("vehicleType", e.target.value)}
          disabled={readOnly}
        >
          {["BUS", "MINIBUS", "HIACE", "JEEP"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Registration year *">
        <input
          type="number"
          min="1980"
          max={new Date().getFullYear() + 1}
          required
          className={inputClass}
          value={draft.vehicle.registrationYear}
          onChange={(e) => setField("registrationYear", e.target.value)}
          placeholder="2024"
          disabled={readOnly}
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Passenger amenities" hint="Select only facilities available on this bus.">
          {amenityError ? (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{amenityError}</div>
          ) : amenities.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-[#DCD4CD] bg-[#FAF8F5] p-3 text-xs text-[#746E69]">No active amenities are available.</div>
          ) : (
            <div className="mt-2 space-y-4 rounded-xl border border-[#DCD4CD] bg-[#FAF8F5] p-4">
              {amenityGroups.map((group) => <div key={group.type}>
                <div className="mb-2">
                  <p className="text-xs font-black text-[#332D29]">{group.label}</p>
                  <p className="text-[11px] text-[#817A74]">{group.hint}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((amenity) => {
                const selected = draft.vehicle.amenityIds.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    disabled={readOnly}
                    aria-pressed={selected}
                    title={amenity.description || amenity.name}
                    onClick={() => update((prev) => ({
                      ...prev,
                      vehicle: {
                        ...prev.vehicle,
                        amenityIds: selected
                          ? prev.vehicle.amenityIds.filter((id) => id !== amenity.id)
                          : [...prev.vehicle.amenityIds, amenity.id],
                        amenityDetails: selected
                          ? prev.vehicle.amenityDetails.filter((item) => item.id !== amenity.id)
                          : [...prev.vehicle.amenityDetails.filter((item) => item.id !== amenity.id), amenity],
                      },
                    }))}
                    className={`rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#DCD4CD] bg-white text-[#655E58] hover:border-[#BDAFA6]"}`}
                  >
                    <span className="block text-xs font-black">{amenity.name}</span>
                    {amenity.description && <span className={`mt-1 block text-[10px] font-medium ${selected ? "text-white/75" : "text-[#817A74]"}`}>{amenity.description}</span>}
                  </button>
                );
              })}
                </div>
              </div>)}
            </div>
          )}
        </FormField>
      </div>
    </div>
  );
}
