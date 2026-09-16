"use client";

import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import { ReadStatus } from "@/features/owner-workspace/WorkspaceUI";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { BusinessProfileHero } from "./components/BusinessProfileHero";
import { OperatorCard } from "./components/OperatorCard";

export default function BusinessProfilePage() {
  const { dashboardState, loading } = useOperatorSession();

  const isKyced = dashboardState?.verificationStatus === "approved";
  const brands = useOwnerResource<OperatorBrand[]>(isKyced ? "/busowner/brands" : null);
  const companyName =
    dashboardState?.profile?.business?.companyName ||
    dashboardState?.profile?.profile?.name ||
    "Business Profile";

  return (
    <div className="w-full">
      <BusinessProfileHero
        isKyced={isKyced}
        companyName={companyName}
        loading={loading}
      />

      {isKyced && (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-neutral-900 px-1">Operators</h2>
          <ReadStatus {...brands} />
          {brands.data?.map(brand => <OperatorCard key={brand.id} companyName={brand.brandName} status={brand.status} />)}
          {brands.data && !brands.data.length && <p className="text-sm text-neutral-600">No operator brands have been assigned to your business yet.</p>}
        </div>
      )}
    </div>
  );
}
