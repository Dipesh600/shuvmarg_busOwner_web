"use client";

const bookings = [
  { id: "BK-9821", route: "KTM → Pokhara",    passenger: "Aarav Sharma",   phone: "984-XXX-0012", seat: "A3",  departure: "23 Jun · 06:00", amount: "Rs. 1,200", status: "Confirmed", bus: "BA-2-KHA-3490" },
  { id: "BK-9820", route: "KTM → Chitwan",    passenger: "Sita Basnet",    phone: "981-XXX-7734", seat: "B7",  departure: "23 Jun · 07:30", amount: "Rs. 950",   status: "Confirmed", bus: "BA-3-KHA-1102" },
  { id: "BK-9819", route: "PKR → Butwal",     passenger: "Ramesh KC",      phone: "978-XXX-4491", seat: "C2",  departure: "23 Jun · 09:00", amount: "Rs. 700",   status: "Pending",   bus: "GA-1-CHA-7841" },
  { id: "BK-9818", route: "KTM → Dharan",     passenger: "Priya Rai",      phone: "986-XXX-2205", seat: "A8",  departure: "23 Jun · 10:30", amount: "Rs. 1,600", status: "Confirmed", bus: "BA-2-KHA-5533" },
  { id: "BK-9817", route: "KTM → Pokhara",    passenger: "Bikash Tamang",  phone: "984-XXX-0087", seat: "D4",  departure: "23 Jun · 06:00", amount: "Rs. 1,200", status: "Cancelled", bus: "BA-2-KHA-3490" },
  { id: "BK-9816", route: "KTM → Chitwan",    passenger: "Rina Gurung",    phone: "980-XXX-9921", seat: "A1",  departure: "22 Jun · 07:30", amount: "Rs. 950",   status: "Completed", bus: "BA-3-KHA-1102" },
  { id: "BK-9815", route: "PKR → Butwal",     passenger: "Suresh Adhikari",phone: "977-XXX-6601", seat: "B3",  departure: "22 Jun · 09:00", amount: "Rs. 700",   status: "Completed", bus: "GA-1-CHA-7841" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed: { bg: "rgba(46,125,50,0.10)",   color: "#2E7D32" },
  Pending:   { bg: "rgba(245,158,11,0.10)",  color: "#F59E0B" },
  Cancelled: { bg: "rgba(211,47,47,0.10)",   color: "#D32F2F" },
  Completed: { bg: "rgba(136,136,136,0.10)", color: "#888888" },
};

export default function BookingsPage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            All passenger reservations across your fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search booking ID, passenger..."
            className="h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-maroon text-neutral-900 w-64"
          />
          <button className="btn-secondary text-sm">
            <span className="material-symbols-rounded mr-1.5 text-[16px]">filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Bookings",    value: bookings.length,                                                      icon: "confirmation_number" },
          { label: "Confirmed",         value: bookings.filter(b => b.status === "Confirmed").length,                icon: "check_circle" },
          { label: "Pending",           value: bookings.filter(b => b.status === "Pending").length,                  icon: "pending" },
          { label: "Cancelled",         value: bookings.filter(b => b.status === "Cancelled").length,                icon: "cancel" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-ivory border border-neutral-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-rounded text-maroon text-[18px]">{kpi.icon}</span>
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">{kpi.value}</div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {["All", "Confirmed", "Pending", "Cancelled", "Completed"].map((tab) => (
          <button
            key={tab}
            className={`flex-shrink-0 h-8 px-4 rounded-full text-xs font-semibold border transition-all ${
              tab === "All"
                ? "bg-maroon text-white border-maroon"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {["Booking ID", "Route", "Passenger", "Phone", "Seat", "Bus", "Departure", "Amount", "Status", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={i} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-neutral-900 whitespace-nowrap">{b.id}</td>
                  <td className="px-5 py-3.5 text-xs font-medium text-neutral-800 whitespace-nowrap">{b.route}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-700">{b.passenger}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-500 font-mono">{b.phone}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-600">{b.seat}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-neutral-500 whitespace-nowrap">{b.bus}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-600 whitespace-nowrap">{b.departure}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-neutral-900 whitespace-nowrap">{b.amount}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                      style={statusStyle[b.status]}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-neutral-400 hover:text-maroon transition-colors">
                      <span className="material-symbols-rounded text-[18px]">more_horiz</span>
                    </button>
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
