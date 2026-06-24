"use client";

const routes = [
  { id: "RT-001", from: "Kathmandu", to: "Pokhara",  distance: "200 km", duration: "6h 30m", buses: 3, dailyTrips: 3, occupancy: 82, revenue: "Rs. 18,400", status: "Active" },
  { id: "RT-002", from: "Kathmandu", to: "Chitwan",  distance: "145 km", duration: "4h 00m", buses: 2, dailyTrips: 2, occupancy: 68, revenue: "Rs. 11,200", status: "Active" },
  { id: "RT-003", from: "Pokhara",   to: "Butwal",   distance: "150 km", duration: "3h 30m", buses: 1, dailyTrips: 2, occupancy: 91, revenue: "Rs. 8,600",  status: "Active" },
  { id: "RT-004", from: "Kathmandu", to: "Dharan",   distance: "380 km", duration: "9h 00m", buses: 2, dailyTrips: 1, occupancy: 40, revenue: "Rs. 6,800",  status: "Active" },
  { id: "RT-005", from: "Kathmandu", to: "Biratnagar",distance: "400 km",duration: "10h 00m",buses: 1, dailyTrips: 1, occupancy: 55, revenue: "Rs. 5,200",  status: "Paused" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active: { bg: "rgba(46,125,50,0.10)",  color: "#2E7D32" },
  Paused: { bg: "rgba(245,158,11,0.10)", color: "#F59E0B" },
};

export default function RoutesPage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Routes & Schedules</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {routes.length} active routes · {routes.reduce((a, r) => a + r.dailyTrips, 0)} daily departures
          </p>
        </div>
        <button className="btn-primary text-sm">
          <span className="material-symbols-rounded mr-1.5 text-[18px]">add</span>
          Add Route
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Routes",   value: routes.length,                                             icon: "route" },
          { label: "Daily Trips",    value: routes.reduce((a, r) => a + r.dailyTrips, 0),              icon: "schedule" },
          { label: "Avg Occupancy",  value: `${Math.round(routes.reduce((a,r)=>a+r.occupancy,0)/routes.length)}%`, icon: "reduce_capacity" },
          { label: "Today's Revenue",value: "Rs. 50,200",                                              icon: "account_balance_wallet" },
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

      {/* Route Cards */}
      <div className="flex flex-col gap-3">
        {routes.map((route) => (
          <div key={route.id} className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Route */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 text-base font-bold text-neutral-900">
                  {route.from}
                  <span className="material-symbols-rounded text-neutral-400 text-[18px]">arrow_forward</span>
                  {route.to}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-500">{route.distance}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs text-neutral-500">{route.duration}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-mono text-neutral-400">{route.id}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className="text-sm font-bold text-neutral-900">{route.buses}</div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Buses</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-neutral-900">{route.dailyTrips}/day</div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Trips</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-sm font-bold"
                    style={{ color: route.occupancy >= 80 ? "#2E7D32" : route.occupancy >= 50 ? "#F59E0B" : "#D32F2F" }}
                  >
                    {route.occupancy}%
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Occupancy</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-neutral-900">{route.revenue}</div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Today</div>
                </div>
              </div>

              {/* Status + Actions */}
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={statusStyle[route.status]}
                >
                  {route.status}
                </span>
                <button className="btn-secondary text-xs h-8 px-3">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
