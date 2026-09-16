"use client";
import { useState } from "react";
import { ownerTripsPath, nepalServiceDate, shiftServiceDate } from "@/features/trip-seat-controls/owner-trip-range";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { writeOwnerData, type OwnerFinance } from "@/features/owner-workspace/api";
import { WorkspaceHeader, Metric, ReadStatus, Pagination, panel, input, button, money } from "@/features/owner-workspace/WorkspaceUI";
import { requestDataRefresh } from "@/lib/data-refresh";
export default function FinancePage() {
  const { dashboardState, loading: sessionLoading } = useOperatorSession();
  const allowed = dashboardState?.verificationStatus === "approved";
  const [page, setPage] = useState(1), [brandId, setBrandId] = useState("");
  const [dates, setDates] = useState(() => ({ from: shiftServiceDate(nepalServiceDate(), -90), to: nepalServiceDate() }));
  const [selected, setSelected] = useState<string[]>([]), [requesting, setRequesting] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState<string | null>(null);
  const finance = useOwnerResource<OwnerFinance>(allowed ? `/busowner/finance?page=${page}` : null);
  const brands = useOwnerResource<OperatorBrand[]>(allowed && requesting ? "/busowner/brands" : null);
  const trips = useOwnerResource<OwnerTrip[]>(allowed && requesting ? ownerTripsPath(dates.from, dates.to) : null);
  const eligible = (trips.data || []).filter(trip => trip.status === "completed" && trip.brandId === brandId);
  const total = (statuses: string[]) => (finance.data?.totals || []).filter(row => statuses.includes(row.status)).reduce((sum, row) => sum + Math.round(row.netPayableAmount * 100), 0) / 100;
  async function save(path: string, method: "POST" | "PATCH", body: unknown) {
    if (busy) return;
    setBusy(true); setMessage(null);
    try { await writeOwnerData(path, method, body); setMessage("Saved successfully."); setSelected([]); requestDataRefresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><WorkspaceHeader title="Finance & settlements" description="Recorded settlement requests, commission and receipt confirmations." />
    {!allowed ? <p className={panel}>{sessionLoading ? "Loading verification…" : "Business approval is required to view settlements."}</p> : <>
      <ReadStatus {...finance} />{message && <p role="status" className={panel}>{message}</p>}
      {finance.data && <><div className="grid gap-3 sm:grid-cols-3"><Metric label="Awaiting payout" value={money(total(["pending", "processing"]))} /><Metric label="Paid, awaiting your receipt" value={money(total(["paid"]))} /><Metric label="Received" value={money(total(["received"]))} /></div>
      <p className="text-xs text-[#746E69]">Totals cover recorded settlements across all dates. These are net settlement amounts, separate from daily booking sales. Payouts require platform review; this page does not transfer money.</p>
      <section className={`${panel} overflow-auto`}><table className="w-full text-left text-sm"><thead><tr><th className="py-3">Date / operator</th><th>Tickets</th><th>Gross</th><th>Commission</th><th>Net payable</th><th>Status</th><th /></tr></thead><tbody>{finance.data.items.map(row => <tr key={row._id} className="border-t border-[#EEE8E2]"><td className="py-3">{new Date(row.createdAt).toLocaleDateString("en-NP", { timeZone: "Asia/Kathmandu" })}<p className="text-xs">{row.brandId?.brandName || "Operator unavailable"}</p></td><td>{row.totalTicketsSold}</td><td>{money(row.grossAmount)}</td><td>{money(row.platformCommission)} ({row.commissionRate}%)</td><td>{money(row.netPayableAmount)}</td><td>{row.status}<p className="text-xs">{row.paymentReference}</p></td><td>{row.status === "paid" && <button className={button} disabled={busy} onClick={() => { if (window.confirm("Confirm only if you have received this payment.")) void save("/busowner/markSettlementReceived", "PATCH", { settlementId: row._id }); }}>Confirm receipt</button>}</td></tr>)}</tbody></table>{!finance.data.items.length && <p className="py-4 text-sm">No settlement requests recorded.</p>}</section><Pagination page={page} totalPages={finance.data.pagination.totalPages} onChange={setPage} /></>}
      <section className={panel}><button className={button} onClick={() => setRequesting(!requesting)}>{requesting ? "Close request" : "Request settlement"}</button>
      {requesting && <div className="mt-4 space-y-3"><p className="text-sm">Select completed departures for one operator. The server checks ownership, previous claims and the recorded commission rate before creating a request.</p><ReadStatus {...brands} /><ReadStatus {...trips} /><select aria-label="Settlement operator" className={input} value={brandId} onChange={event => { setBrandId(event.target.value); setSelected([]); }}><option value="">Select operator</option>{brands.data?.filter(brand => brand.status !== "SUSPENDED").map(brand => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select>
      <div className="flex flex-wrap gap-3"><input aria-label="Settlement departure dates from" type="date" className={input} value={dates.from} onChange={event => { setDates({ ...dates, from: event.target.value }); setSelected([]); }} /><input aria-label="Settlement departure dates to" type="date" className={input} value={dates.to} onChange={event => { setDates({ ...dates, to: event.target.value }); setSelected([]); }} /><span className="self-center text-xs">Maximum 91 days</span></div><div className="max-h-64 overflow-auto space-y-2">{eligible.map(trip => <label key={trip._id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={selected.includes(trip._id)} disabled={busy || (!selected.includes(trip._id) && selected.length >= 100)} onChange={event => setSelected(event.target.checked ? [...selected, trip._id] : selected.filter(id => id !== trip._id))} />{trip.tripDate.slice(0, 10)} · {trip.departureTime} · {trip.busId?.busName || trip.tripId || "Departure"}</label>)}</div>{brandId && trips.data && !eligible.length && <p className="text-sm">No completed departures for this operator.</p>}<button className={button} disabled={busy || !brandId || !selected.length} onClick={() => void save("/busowner/raiseSettlement", "POST", { brandId, tripIds: selected })}>{busy ? "Saving…" : `Submit request (${selected.length} departures)`}</button></div>}</section>
    </>}</div>;
}
