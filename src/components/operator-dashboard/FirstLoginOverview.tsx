"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BusFront,
  Check,
  ChevronRight,
  CircleDashed,
  Clock3,
  FileText,
  Landmark,
  Route,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { OperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  findApprovedFleetAwaitingOperationsById,
  findFirstApprovedFleetAwaitingOperations,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  calculateBusinessDraftProgress,
  EMPTY_BUSINESS_VERIFICATION_DRAFT,
  type BusinessDraftProgress,
} from "@/features/operator-dashboard/business-verification-draft";
import {
  loadBusinessDraft,
  loadDraftFiles,
} from "@/features/operator-dashboard/business-verification-draft-storage";
import DashboardGreeting from "./DashboardGreeting";
import OperationalReadiness from "./OperationalReadiness";
import BusinessSetupModal from "./BusinessSetupModal";
import SubmittedBusinessPreviewModal from "./business-setup-modal/SubmittedBusinessPreviewModal";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";
import FleetSetupOverview from "./FleetSetupOverview";
import FirstFleetOperationsSetup from "./FirstFleetOperationsSetup";
import { cleanupLockedServerFleetDrafts, setActiveDraftId } from "@/features/fleet-registration/fleet-registration-draft-storage";

type SetupTrack = "business" | "fleet" | "operations";

interface FirstLoginOverviewProps {
  state: OperatorDashboardState;
  initialOperationsFleetId?: string | null;
}

const INITIAL_PROGRESS = calculateBusinessDraftProgress(
  EMPTY_BUSINESS_VERIFICATION_DRAFT,
  []
);

export default function FirstLoginOverview({
  state,
  initialOperationsFleetId = null,
}: FirstLoginOverviewProps) {
  const [selectedOperationsFleetId, setSelectedOperationsFleetId] = useState<string | null>(initialOperationsFleetId);
  const requestedApprovedFleet = findApprovedFleetAwaitingOperationsById(state, selectedOperationsFleetId);
  const firstApprovedFleet = requestedApprovedFleet || findFirstApprovedFleetAwaitingOperations(state);
  const selectedFleetSetup = firstApprovedFleet
    ? state.fleetSetupStatusesByFleetId[firstApprovedFleet.fleetId] ||
      (state.firstFleetSetup?.fleetId === firstApprovedFleet.fleetId ? state.firstFleetSetup : null)
    : null;
  const hasOperationsSetup = Boolean(firstApprovedFleet && selectedFleetSetup);
  const [activeTrack, setActiveTrack] = useState<SetupTrack>(
    hasOperationsSetup ? "operations" : state.verificationStatus === "approved" ? "fleet" : "business"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fleetRegistrationOpen, setFleetRegistrationOpen] = useState(false);
  const [modalStep, setModalStep] = useState<0 | 1 | 2 | 3>(0);
  const [draftProgress, setDraftProgress] =
    useState<BusinessDraftProgress>(INITIAL_PROGRESS);

  const profile = state.profile;
  const ownerName = profile?.profile.name || null;
  const ownerKey = profile?.ownerId || profile?.userId || null;
  const isDraft = state.verificationStatus === "not_submitted";
  const isPending = state.verificationStatus === "pending";
  const isRejected = state.verificationStatus === "rejected";
  const isBusinessApproved = state.verificationStatus === "approved";

  useEffect(() => {
    if (!ownerKey) {
      return;
    }
    let active = true;
    const stored = loadBusinessDraft(ownerKey);
    const draft = {
      ...EMPTY_BUSINESS_VERIFICATION_DRAFT,
      companyName: profile?.business.companyName || "",
      ownerName: profile?.profile.name || "",
      registeredTole: profile?.business.registeredAddress?.tole || "",
      registeredWardNumber: profile?.business.registeredAddress?.wardNumber || "",
      registeredMunicipality: profile?.business.registeredAddress?.municipality || "",
      registeredDistrict: profile?.business.registeredAddress?.district || "",
      registeredProvince: profile?.business.registeredAddress?.province || "",
      registeredPostalCode: profile?.business.registeredAddress?.postalCode || "",
      registeredCountry: profile?.business.registeredAddress?.country || "Nepal",
      ...stored,
    };

    loadDraftFiles(ownerKey)
      .then((files) => {
        if (!active) return;
        setDraftProgress(
          calculateBusinessDraftProgress(
            draft,
            Object.entries(files)
              .filter(([, selected]) => Boolean(selected?.length))
              .map(([field]) => field)
          )
        );
      })
      .catch(() => {
        if (active) setDraftProgress(calculateBusinessDraftProgress(draft, []));
      });

    return () => {
      active = false;
    };
  }, [ownerKey, profile]);

  useEffect(() => {
    void cleanupLockedServerFleetDrafts(state.fleet.items);
  }, [state.fleet.items]);

  const openSetup = (step: 0 | 1 | 2 | 3) => {
    if (!ownerKey || !profile) return;
    setModalStep(step);
    setModalOpen(true);
  };

  const handleProgressChange = useCallback((progress: BusinessDraftProgress) => {
    setDraftProgress(progress);
  }, []);

  const draftNextAction =
    draftProgress.nextStep === 0
      ? {
          eyebrow: "Start here",
          title: "Add business details",
          detail: "Legal name, registered address, PAN and registration number.",
          button: "Add business details",
          step: 0 as const,
        }
      : draftProgress.nextStep === 1
        ? {
            eyebrow: "Next step",
            title: "Add settlement account",
            detail: "Use the bank account where ticket revenue should be paid.",
            button: "Add bank account",
            step: 1 as const,
          }
        : draftProgress.nextStep === 2
          ? {
              eyebrow: "Next step",
              title: "Upload required documents",
              detail: "Company registration, PAN and owner citizenship or identity.",
              button: "Upload documents",
              step: 2 as const,
            }
          : {
              eyebrow: "Ready to submit",
              title: "Review your application",
              detail: "Check all details once before starting compliance review.",
              button: "Review application",
              step: 3 as const,
            };

  const setupRows = [
    {
      id: "basic",
      label: "Basic account setup",
      detail: "Name, phone and sign-in details",
      complete: true,
      icon: UserRound,
      action: (
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7A1D1B] hover:underline"
        >
          View profile <ChevronRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id: "business",
      label: "Business verification",
      detail: "Legal business and tax information",
      complete: isDraft ? draftProgress.businessComplete : isBusinessApproved,
      stateLabel: isPending ? "Under review" : isRejected ? "Update required" : isBusinessApproved ? "Approved" : undefined,
      icon: ShieldCheck,
      step: 0 as const,
    },
    {
      id: "settlement",
      label: "Settlement account",
      detail: "Bank details for payouts",
      complete: isDraft ? draftProgress.settlementComplete : true,
      stateLabel: isDraft ? undefined : "Submitted",
      icon: Landmark,
      step: 1 as const,
    },
    {
      id: "documents",
      label: "Documents",
      detail: "Registration, tax and owner identity",
      complete: isDraft ? draftProgress.documentsComplete : isBusinessApproved,
      stateLabel: isPending ? "Received" : isRejected ? "Check feedback" : isBusinessApproved ? "Approved" : undefined,
      icon: FileText,
      step: 2 as const,
    },
  ];

  const progressPercentage = isDraft ? draftProgress.percentage : isBusinessApproved ? 100 : 75;
  const headerTitle = hasOperationsSetup
    ? "Your first bus is approved — get it ready"
    : isDraft
    ? "Complete your business setup"
    : isPending
      ? "Business review in progress"
      : isRejected
        ? "Update your business application"
        : "Business approved — prepare your fleet";

  const reviewAction = isPending
    ? {
        eyebrow: "Application received",
        title: "Your details are under review",
        detail: "You can review exactly what was submitted while preparing for the fleet setup stage.",
        button: "Open fleet preparedness",
        icon: Clock3,
      }
    : isRejected
      ? {
          eyebrow: "Action required",
          title: "Changes are needed",
          detail: state.kycStatus?.rejectionReason || state.profile?.rejectionReason || "Review the highlighted feedback and update only the requested information.",
          button: "Review and update",
          icon: AlertTriangle,
        }
      : {
          eyebrow: "Business approved",
          title: "Move to fleet preparation",
          detail: "Your business verification is complete. You can now submit prepared vehicles for review.",
          button: "Open fleet preparedness",
          icon: BadgeCheck,
        };
  const ReviewActionIcon = reviewAction.icon;

  return (
    <div className="space-y-7">
      <DashboardGreeting ownerName={ownerName} />

      <section className="overflow-hidden rounded-[28px] border border-[#E8E1DB] bg-white shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-[#E8E1DB] bg-[linear-gradient(110deg,#FFF9F5_0%,#FFFFFF_60%,#FFF3EF_100%)] px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A1D1B]">
              Setup journey
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-[#191512] sm:text-2xl">
              {headerTitle}
            </h2>
          </div>

          <div className={`grid ${hasOperationsSetup ? "grid-cols-3" : "grid-cols-2"} rounded-2xl border border-[#E5DCD5] bg-white p-1.5 shadow-sm`} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTrack === "business"}
              onClick={() => setActiveTrack("business")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${activeTrack === "business" ? "bg-[#7A1D1B] text-white" : "text-[#655E58] hover:bg-[#FAF7F4]"}`}
            >
              <ShieldCheck className="h-4 w-4" />
              KYC & Compliance
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTrack === "fleet"}
              onClick={() => setActiveTrack("fleet")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${activeTrack === "fleet" ? "bg-[#7A1D1B] text-white" : "text-[#655E58] hover:bg-[#FAF7F4]"}`}
            >
              <BusFront className="h-4 w-4" />
              Buses
            </button>
            {hasOperationsSetup && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTrack === "operations"}
                onClick={() => setActiveTrack("operations")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${activeTrack === "operations" ? "bg-[#7A1D1B] text-white" : "text-[#655E58] hover:bg-[#FAF7F4]"}`}
              >
                <Route className="h-4 w-4" />
                Get Bus Ready
              </button>
            )}
          </div>
        </div>

        {activeTrack === "business" ? (
          <div className="grid lg:grid-cols-12">
            <div className="space-y-5 border-b border-[#E8E1DB] p-5 sm:p-7 lg:col-span-7 lg:border-b-0 lg:border-r">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817A74]">
                    Setup progress
                  </div>
                  <div className="mt-1 text-sm font-bold text-[#211D1A]">
                    {isDraft
                      ? draftProgress.percentage === 25 ? "Basic setup complete" : "Draft saved on this device"
                      : isPending ? "Application submitted" : isRejected ? "Review feedback" : "Business verification complete"}
                  </div>
                </div>
                <div className="font-display text-3xl font-bold text-[#7A1D1B]">
                  {progressPercentage}%
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#F1ECE8]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7A1D1B,#D96861)] transition-[width] duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="space-y-2.5">
                {setupRows.map((row) => {
                  const Icon = row.icon;
                  const content = (
                    <>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.complete ? "bg-emerald-50 text-[#2E7D32]" : "bg-[#FFF1EE] text-[#7A1D1B]"}`}>
                        {row.complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#211D1A]">{row.label}</div>
                        <div className="mt-0.5 text-[10px] font-medium text-[#817A74]">{row.detail}</div>
                      </div>
                      {row.action || (
                        <div className="flex items-center gap-2">
                          <span className={`hidden text-[10px] font-bold sm:inline ${row.complete ? "text-[#2E7D32]" : row.stateLabel === "Update required" || row.stateLabel === "Check feedback" ? "text-red-600" : "text-[#8D857F]"}`}>
                            {row.stateLabel || (row.complete ? "Draft complete" : "Not started")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#B0A8A2]" />
                        </div>
                      )}
                    </>
                  );

                  return row.step !== undefined && (isDraft || isRejected) ? (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => openSetup(row.step)}
                      className="flex w-full items-center gap-3.5 rounded-2xl border border-[#E8E1DB] bg-white p-3.5 text-left transition hover:border-[#D8B9B4] hover:bg-[#FFFCFA]"
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={row.id} className="flex items-center gap-3.5 rounded-2xl border border-[#E8E1DB] bg-white p-3.5">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="flex flex-col justify-between bg-[#FFFCFA] p-5 sm:p-7 lg:col-span-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D8D1] bg-white px-3 py-1.5 text-[10px] font-bold text-[#7A1D1B]">
                  <CircleDashed className="h-3.5 w-3.5" />
                  Margdarshak
                </div>
                {isDraft ? (
                  <>
                    <h3 className="mt-5 font-display text-xl font-bold text-[#211D1A]">{draftNextAction.title}</h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#746E69]">{draftNextAction.detail}</p>
                    <div className="mt-5 rounded-2xl border border-[#ECD3CD] bg-[#FFF3F0] p-4"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#7A1D1B]">{draftNextAction.eyebrow}</div><div className="mt-2 flex items-center justify-between text-xs font-bold text-[#3B332E]"><span>{draftNextAction.button}</span><span>{progressPercentage}%</span></div></div>
                  </>
                ) : (
                  <>
                    <div className={`mt-5 flex h-11 w-11 items-center justify-center rounded-xl ${isRejected ? "bg-red-50 text-red-700" : isPending ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><ReviewActionIcon className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-display text-xl font-bold text-[#211D1A]">{reviewAction.title}</h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#746E69]">{reviewAction.detail}</p>
                    <div className={`mt-5 rounded-2xl border p-4 ${isRejected ? "border-red-200 bg-red-50/60" : "border-[#ECD3CD] bg-[#FFF3F0]"}`}><div className={`text-[9px] font-bold uppercase tracking-[0.13em] ${isRejected ? "text-red-700" : "text-[#7A1D1B]"}`}>{reviewAction.eyebrow}</div><div className="mt-2 flex items-center justify-between text-xs font-bold text-[#3B332E]"><span>{reviewAction.button}</span><span>{progressPercentage}%</span></div></div>
                  </>
                )}
              </div>

              {!isDraft && state.kycStatus && (
                <button type="button" onClick={() => setPreviewOpen(true)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCCFC8] bg-white px-4 py-2.5 text-xs font-bold text-[#7A1D1B] transition hover:bg-[#FFF7F4]">
                  Preview submitted application
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isDraft) openSetup(draftNextAction.step);
                  else if (isRejected) openSetup(state.kycStatus?.documents?.some((document) => document.rejectionReason) ? 2 : 0);
                  else if (isPending) setActiveTrack("fleet");
                  else setActiveTrack(hasOperationsSetup ? "operations" : "fleet");
                }}
                className={`${isDraft ? "mt-6" : "mt-2.5"} inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#5C1414]`}
              >
                {isDraft ? draftNextAction.button : reviewAction.button}
                <ArrowRight className="h-4 w-4" />
              </button>
            </aside>
          </div>
        ) : activeTrack === "operations" && firstApprovedFleet && selectedFleetSetup ? (
          <FirstFleetOperationsSetup
            fleet={firstApprovedFleet}
            setup={selectedFleetSetup}
            onBackToBuses={() => setActiveTrack("fleet")}
          />
        ) : (
          <FleetSetupOverview
            fleets={state.fleet.items}
            setupStatusesByFleetId={state.fleetSetupStatusesByFleetId}
            onOpenOperations={(fleetId) => {
              setSelectedOperationsFleetId(fleetId);
              setActiveTrack("operations");
            }}
            onAddVehicle={(draftId?: string) => {
              if (draftId) {
                setActiveDraftId(draftId);
              }
              setFleetRegistrationOpen(true);
            }}
          />
        )}
      </section>

      {!hasOperationsSetup && (
        <OperationalReadiness verificationStatus={state.verificationStatus} fleets={state.fleet.items} />
      )}

      {modalOpen && profile && ownerKey && (
        <BusinessSetupModal
          isOpen
          initialStep={modalStep}
          profile={profile}
          kycStatus={state.kycStatus}
          ownerKey={ownerKey}
          onClose={() => setModalOpen(false)}
          onProgressChange={handleProgressChange}
          onSubmitted={() => window.location.reload()}
        />
      )}

      {previewOpen && profile && state.kycStatus && (
        <SubmittedBusinessPreviewModal
          profile={profile}
          kycStatus={state.kycStatus}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      <FleetRegistrationFlow
        open={fleetRegistrationOpen}
        canSubmitForReview={isBusinessApproved}
        onClose={() => setFleetRegistrationOpen(false)}
        onRegistered={() => {
          setFleetRegistrationOpen(false);
          if (typeof window !== "undefined") {
          }
          window.location.reload();
        }}
      />
    </div>
  );
}
