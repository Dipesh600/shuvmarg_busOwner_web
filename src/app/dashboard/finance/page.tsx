"use client";

const transactions = [
  { id: "TX-00291", date: "23 Jun 2025", description: "KTM → Pokhara · BK-9821", amount: "+Rs. 1,200", type: "credit", status: "Settled" },
  { id: "TX-00290", date: "23 Jun 2025", description: "KTM → Chitwan · BK-9820", amount: "+Rs. 950",   type: "credit", status: "Settled" },
  { id: "TX-00289", date: "23 Jun 2025", description: "PKR → Butwal  · BK-9819", amount: "+Rs. 700",   type: "credit", status: "Pending" },
  { id: "TX-00288", date: "22 Jun 2025", description: "Cancellation Refund · BK-9817", amount: "−Rs. 1,200", type: "debit", status: "Settled" },
  { id: "TX-00280", date: "16 Jun 2025", description: "Weekly Payout Batch",          amount: "−Rs. 32,400", type: "payout", status: "Settled" },
  { id: "TX-00279", date: "15 Jun 2025", description: "KTM → Dharan  · BK-9801",    amount: "+Rs. 1,600",  type: "credit", status: "Settled" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Settled: { bg: "rgba(46,125,50,0.10)",  color: "#2E7D32" },
  Pending: { bg: "rgba(245,158,11,0.10)", color: "#F59E0B" },
};

const typeColor: Record<string, string> = {
  credit: "#2E7D32",
  debit:  "#D32F2F",
  payout: "#7A1D1B",
};

export default function FinancePage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financial Ledger</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Revenue, payouts, and transaction history
          </p>
        </div>
        <button className="btn-secondary text-sm">
          <span className="material-symbols-rounded mr-1.5 text-[16px]">download</span>
          Export Report
        </button>
      </div>

      {/* KPI + Balance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Balance Card */}
        <div className="lg:col-span-1 bg-maroon rounded-xl p-6 flex flex-col justify-between text-white relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #F8F1E3 0, #F8F1E3 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(248,241,227,0.6)" }}>
              Available Balance
            </div>
            <div className="text-3xl font-bold mt-2" style={{ color: "#F8F1E3" }}>
              Rs. 12,750
            </div>
            <div className="text-xs mt-1" style={{ color: "rgba(248,241,227,0.55)" }}>
              Next payout: Monday, 30 Jun
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <button
              className="h-9 px-5 rounded-xl text-sm font-semibold border border-[rgba(248,241,227,0.3)] transition-colors hover:bg-[rgba(248,241,227,0.1)]"
              style={{ color: "#F8F1E3" }}
            >
              Request Payout
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Month Revenue",  value: "Rs. 3,12,400", change: "+14%",   icon: "account_balance_wallet", positive: true },
            { label: "Month Payouts",  value: "Rs. 2,84,950", change: "2 done", icon: "payments",               positive: true },
            { label: "Platform Fee",   value: "Rs. 24,990",   change: "8%",     icon: "percent",                positive: false },
            { label: "Pending",        value: "Rs. 12,750",   change: "2 txns", icon: "pending",                positive: false },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-ivory border border-neutral-200 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-maroon text-[18px]">{kpi.icon}</span>
              </div>
              <div>
                <div className="text-lg font-bold text-neutral-900">{kpi.value}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{kpi.label}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      color: kpi.positive ? "#2E7D32" : "#888888",
                      background: kpi.positive ? "rgba(46,125,50,0.10)" : "rgba(136,136,136,0.10)",
                    }}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">Transaction History</div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs h-8">This Month</button>
            <button className="btn-ghost text-xs h-8">All Time</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {["Transaction ID", "Date", "Description", "Amount", "Status"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-neutral-900">{tx.id}</td>
                  <td className="px-6 py-4 text-xs text-neutral-500">{tx.date}</td>
                  <td className="px-6 py-4 text-xs text-neutral-700">{tx.description}</td>
                  <td className="px-6 py-4 text-xs font-bold" style={{ color: typeColor[tx.type] }}>{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={statusStyle[tx.status]}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
