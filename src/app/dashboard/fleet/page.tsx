"use client";

const buses = [
  { id: "BA-2-KHA-3490", type: "AC Deluxe", seats: 32, status: "Active", driver: "Ram Bahadur K.", route: "KTM → Pokhara", occupancy: 85 },
  { id: "BA-3-KHA-1102", type: "AC Sleeper", seats: 24, status: "Active", driver: "Mohan Shrestha", route: "KTM → Chitwan", occupancy: 62 },
  { id: "GA-1-CHA-7841", type: "Deluxe",    seats: 40, status: "Active", driver: "Hari Tamang",    route: "PKR → Butwal", occupancy: 91 },
  { id: "BA-2-KHA-5533", type: "Mini",      seats: 18, status: "Active", driver: "Suman Rai",      route: "KTM → Dharan", occupancy: 40 },
  { id: "GA-2-KHA-0091", type: "AC Deluxe", seats: 32, status: "Maintenance", driver: "—", route: "—", occupancy: 0 },
  { id: "JH-1-KHA-9023", type: "Sleeper",   seats: 24, status: "Inactive", driver: "—", route: "—", occupancy: 0 },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active:      { bg: "rgba(46,125,50,0.10)",   color: "#2E7D32" },
  Maintenance: { bg: "rgba(245,158,11,0.10)",  color: "#F59E0B" },
  Inactive:    { bg: "rgba(136,136,136,0.10)", color: "#888888" },
};

export default function FleetPage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Fleet Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {buses.length} buses registered · {buses.filter(b => b.status === "Active").length} active
          </p>
        </div>
        <button className="btn-primary text-sm">
          <span className="material-symbols-rounded mr-1.5 text-[18px]">add</span>
          Add Bus
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Buses",  value: buses.length,                                    icon: "directions_bus" },
          { label: "Active",       value: buses.filter(b => b.status === "Active").length,   icon: "check_circle" },
          { label: "Maintenance",  value: buses.filter(b => b.status === "Maintenance").length, icon: "build" },
          { label: "Avg Occupancy", value: `${Math.round(buses.filter(b=>b.occupancy>0).reduce((a,b)=>a+b.occupancy,0)/buses.filter(b=>b.occupancy>0).length)}%`, icon: "reduce_capacity" },
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">All Vehicles</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by plate or route..."
              className="h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-maroon text-neutral-900 w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {["Plate No.", "Type", "Seats", "Driver", "Route", "Occupancy", "Status", ""].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buses.map((bus, i) => (
                <tr key={i} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-neutral-900">{bus.id}</td>
                  <td className="px-6 py-4 text-xs text-neutral-700">{bus.type}</td>
                  <td className="px-6 py-4 text-xs text-neutral-600">{bus.seats}</td>
                  <td className="px-6 py-4 text-xs text-neutral-700">{bus.driver}</td>
                  <td className="px-6 py-4 text-xs text-neutral-600">{bus.route}</td>
                  <td className="px-6 py-4">
                    {bus.occupancy > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-neutral-100 w-16">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${bus.occupancy}%`,
                              background: bus.occupancy >= 80 ? "#2E7D32" : bus.occupancy >= 50 ? "#F59E0B" : "#D32F2F",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-600">{bus.occupancy}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={statusStyle[bus.status]}
                    >
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
