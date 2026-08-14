import { useState, useEffect, useCallback } from "react";
import FormField, { inputClass } from "../components/FormField";
import type { FleetRegistrationDraft } from "../types";
import { listMyBrands, type OperatorBrand } from "../api-brands";

interface VehicleDetailsStepProps {
  draft: FleetRegistrationDraft;
  update: (
    next:
      | FleetRegistrationDraft
      | ((prev: FleetRegistrationDraft) => FleetRegistrationDraft)
  ) => void;
}

export default function VehicleDetailsStep({
  draft,
  update,
}: VehicleDetailsStepProps) {
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(true);
  const [brandError, setBrandError] = useState<string | null>(null);

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
        />
      </FormField>

      <FormField label="Plate number *">
        <input
          className={inputClass}
          value={draft.vehicle.busNumber}
          onChange={(e) => setField("busNumber", e.target.value.toUpperCase())}
          placeholder="BA 3 KHA 1234"
          required
        />
      </FormField>

      <FormField label="Service type *">
        <select
          className={inputClass}
          value={draft.vehicle.busType}
          onChange={(e) => setField("busType", e.target.value)}
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
        />
      </FormField>
    </div>
  );
}
