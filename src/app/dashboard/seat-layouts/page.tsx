"use client";

import SeatLayoutBuilder from "@/features/seat-layout-v3/SeatLayoutBuilder";
import { SeatLayoutStudioHeader } from "./components/SeatLayoutStudioHeader";
import { SeatLayoutTemplateSidebar } from "./components/SeatLayoutTemplateSidebar";
import { SeatLayoutMetaForm } from "./components/SeatLayoutMetaForm";
import { SeatLayoutOperations } from "./components/SeatLayoutOperations";
import { useSeatLayoutStudio } from "./hooks/useSeatLayoutStudio";

export default function SeatLayoutsPage() {
  const {
    catalog,
    mine,
    selected,
    layout,
    name,
    code,
    summary,
    busy,
    message,
    fleets,
    fleetId,
    setName,
    setCode,
    setSummary,
    setLayout,
    setMessage,
    setFleetId,
    choose,
    adopt,
    save,
    submit,
    assign,
  } = useSeatLayoutStudio();

  return (
    <div className="min-h-full bg-[#FAF8F5] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-[1540px] space-y-4 sm:space-y-6">
        {/* ── Top Framed Hero Header Card matching reference screenshot ── */}
        <SeatLayoutStudioHeader />

        {/* ── 2-Column Main Studio Workspace Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-4 sm:gap-6 items-start">
          {/* Left Column: Template Library */}
          <SeatLayoutTemplateSidebar
            catalog={catalog}
            mine={mine}
            activeId={selected?.template.id}
            onChoose={choose}
          />

          {/* Right Column: Main Studio Container + Operations */}
          <main className="min-w-0 space-y-4 sm:space-y-6">
            {selected ? (
              <>
                {/* Unified Studio Container Card matching reference */}
                <section className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-3.5 sm:p-6 lg:p-7 shadow-xs space-y-4 sm:space-y-6">
                  {/* Metadata Fields Form */}
                  <SeatLayoutMetaForm
                    selected={selected}
                    name={name}
                    code={code}
                    summary={summary}
                    busy={busy}
                    onNameChange={setName}
                    onCodeChange={setCode}
                    onSummaryChange={setSummary}
                    onAdopt={adopt}
                  />

                  {/* Interactive Seat Layout Canvas & Controls */}
                  <SeatLayoutBuilder
                    layout={layout}
                    onChange={setLayout}
                    onSave={save}
                    busy={busy}
                  />
                </section>

                {/* Revision History & Fleet Assignment (Operator Scope) */}
                {selected.template.scope === "OPERATOR" && (
                  <SeatLayoutOperations
                    selected={selected}
                    fleets={fleets}
                    fleetId={fleetId}
                    busy={busy}
                    onFleetChange={setFleetId}
                    onSubmitDraft={submit}
                    onAssignFleet={assign}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-8 sm:p-16 text-center shadow-xs">
                <p className="font-bold text-[#191512]">Choose a layout to begin</p>
                <p className="mt-1 text-xs text-[#938A82]">
                  Select a template from the list to preview or customize.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {message && (
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-3.5 text-left text-xs font-semibold text-white shadow-2xl transition hover:bg-[#2A2520] cursor-pointer"
        >
          {message}
        </button>
      )}
    </div>
  );
}
