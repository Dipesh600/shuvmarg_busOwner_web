"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FirstFleetOperationsSetup from "@/components/operator-dashboard/FirstFleetOperationsSetup";
import { BusWorkstationScreen } from "@/components/dashboard/fleet/workstation/BusWorkstationScreen";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import type {
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import type { FleetDetailPayload } from "@/features/fleet-registration/api";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { ReadStatus } from "@/features/owner-workspace/WorkspaceUI";
import OwnerDocumentGallery from "@/features/vehicle-documents/OwnerDocumentGallery";

export default function FleetDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const params = useParams<{ fleetId: string }>();
  const fleetId = params.fleetId;
  const { dashboardState } = useOperatorSession();
  const detail = useOwnerResource<FleetDetailPayload>(
    fleetId ? `/busowner/fleets/${encodeURIComponent(fleetId)}` : null,
  );
  const fromList = dashboardState?.fleet.items.find((f) => f.fleetId === fleetId);
  const approved = (detail.data?.approvalStatus || fromList?.approvalStatus) === "APPROVED";
  const setupRead = useOwnerResource<OperatorFleetSetupStatus>(
    approved && !detail.error ? `/busowner/fleets/${encodeURIComponent(fleetId)}/setup-status` : null,
  );
  const setup = setupRead.data || dashboardState?.fleetSetupStatusesByFleetId[fleetId];

  const isLive = Boolean(
    approved &&
    (setup?.setupComplete ||
     setup?.isFullyOperational ||
     fromList?.setupComplete ||
     fromList?.status === "active" ||
     (setup?.progress && setup.progress.percentage === 100))
  );

  const fleet: OperatorFleetListItem | undefined =
    fromList ||
    (detail.data
      ? {
          fleetId,
          fleetCode: null,
          busName: detail.data.busName || "Bus",
          busNumber: detail.data.busNumber || "Unavailable",
          approvalStatus: detail.data.approvalStatus || "DRAFT",
          rejectionReason: null,
          setupComplete: isLive,
          createdAt: null,
          updatedAt: null,
        }
      : undefined);

  if (!fleet && detail.loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12 text-center text-sm text-neutral-500">
        Loading bus details…
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/fleet" className="text-sm font-bold text-[#7A1D1B]">
          ← Back to buses
        </Link>
        <ReadStatus {...detail} />
      </div>
    );
  }

  if (searchParams.get("tab") === "documents" && detail.data && !isLive) {
    return <div className="w-full max-w-6xl mx-auto py-6 space-y-4">
      <Link href="/dashboard/fleet" className="text-sm font-bold text-[#7A1D1B]">← Back to buses</Link>
      <ReadStatus {...detail} />
      <OwnerDocumentGallery fleetId={fleetId} manifest={detail.data.documents || {}} />
    </div>;
  }
  if (!approved && fleet) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#7A1D1B]"
          href="/dashboard/fleet"
        >
          ← Back to buses
        </Link>
        <div className="bg-white rounded-3xl border border-[#EDE7E0] p-8 text-center space-y-3 shadow-2xs">
          <h2 className="text-xl font-bold text-[#191512]">Complete fleet review first</h2>
          <p className="text-sm text-[#746E69] max-w-md mx-auto">
            {fleet.rejectionReason ||
              "Drafts and review corrections are managed in My Buses. Operational setup becomes available after approval."}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/fleet"
              className="inline-flex items-center justify-center rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#5C1414] transition"
            >
              Back to My Buses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // When bus is already live, render the dedicated Bus Workstation
  if (fleet && setup && detail.data && isLive && view !== "setup") {
    return (
      <div className="w-full min-h-full pt-1 pb-4 sm:pt-2 sm:pb-5">
        <ReadStatus {...detail} />
        <ReadStatus {...setupRead} />
        <BusWorkstationScreen
          key={fleetId}
          fleet={fleet}
          setup={setup}
          detail={detail.data}
          onOpenSetup={() => router.push(`/dashboard/fleet/${encodeURIComponent(fleetId)}?view=setup`)}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full py-4 sm:py-6 space-y-4">
      <ReadStatus {...detail} />
      <ReadStatus {...setupRead} />
      {isLive && (
        <div className="max-w-4xl mx-auto flex items-center justify-between bg-white border border-[#EDE7E0] px-4 py-2.5 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-[#554E48]">
            This bus is live in service.
          </span>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/fleet/${encodeURIComponent(fleetId)}`)}
            className="text-xs font-bold text-[#7A1D1B] hover:underline cursor-pointer"
          >
            ← Open Bus Workstation
          </button>
        </div>
      )}
      {fleet && setup && detail.data && (
        <FirstFleetOperationsSetup
          key={fleetId}
          fleet={fleet}
          setup={setup}
          eyebrow="My Bus"
          onBackToBuses={() => router.push("/dashboard/fleet")}
        />
      )}
    </div>
  );
}
