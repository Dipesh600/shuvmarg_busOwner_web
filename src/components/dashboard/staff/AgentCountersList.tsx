import React from "react";
import {
  Store,
  MapPin,
  Phone,
  Percent,
  CheckCircle,
  Clock,
  Ticket,
} from "lucide-react";
import { PartnerAgentCounter } from "./staff-contract";

const DEFAULT_PARTNER_COUNTERS: PartnerAgentCounter[] = [
  {
    id: "agt-1",
    counterName: "Gongabu Main Bus Park Counter #14",
    agentName: "Bishal Shrestha",
    phone: "9841234567",
    location: "New Bus Park, Gongabu",
    district: "Kathmandu",
    commissionRate: "5.0%",
    status: "ACTIVE",
    ticketsSoldMonth: 142,
    joinedDate: "2025-11-10",
  },
  {
    id: "agt-2",
    counterName: "Prithvi Chowk Travel Desk",
    agentName: "Ramesh Gurung",
    phone: "9856012345",
    location: "Prithvi Chowk",
    district: "Pokhara",
    commissionRate: "5.0%",
    status: "ACTIVE",
    ticketsSoldMonth: 98,
    joinedDate: "2025-12-04",
  },
  {
    id: "agt-3",
    counterName: "Kalanki Passenger Hub Counter",
    agentName: "Sita Sharma",
    phone: "9801987654",
    location: "Kalanki Chowk",
    district: "Kathmandu",
    commissionRate: "5.0%",
    status: "ACTIVE",
    ticketsSoldMonth: 114,
    joinedDate: "2026-01-15",
  },
  {
    id: "agt-4",
    counterName: "Narayangarh Pulchowk Desk",
    agentName: "Deepak Adhikari",
    phone: "9845012399",
    location: "Pulchowk, Narayangarh",
    district: "Chitwan",
    commissionRate: "4.5%",
    status: "ACTIVE",
    ticketsSoldMonth: 67,
    joinedDate: "2026-02-01",
  },
  {
    id: "agt-5",
    counterName: "Butwal Traffic Chowk Counter",
    agentName: "Kiran Thapa",
    phone: "9857023412",
    location: "Traffic Chowk",
    district: "Butwal",
    commissionRate: "5.0%",
    status: "ACTIVE",
    ticketsSoldMonth: 83,
    joinedDate: "2026-02-18",
  },
  {
    id: "agt-6",
    counterName: "Hetauda Bus Terminal Agency",
    agentName: "Prakash Lama",
    phone: "9842099881",
    location: "Main Terminal",
    district: "Makwanpur",
    commissionRate: "5.0%",
    status: "ACTIVE",
    ticketsSoldMonth: 52,
    joinedDate: "2026-03-02",
  },
];

interface AgentCountersListProps {
  searchQuery: string;
}

export default function AgentCountersList({ searchQuery }: AgentCountersListProps) {
  const filteredAgents = DEFAULT_PARTNER_COUNTERS.filter((agent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.counterName.toLowerCase().includes(q) ||
      agent.agentName.toLowerCase().includes(q) ||
      agent.location.toLowerCase().includes(q) ||
      agent.district.toLowerCase().includes(q) ||
      agent.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[17px] font-bold text-neutral-900 leading-tight">
            Authorized Partner Ticketing Counters
          </h3>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Registered physical travel desks and partner agencies distributing your bus tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between hover:border-neutral-200 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center font-bold shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-green-100 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active Partner
                </span>
              </div>

              <h4 className="text-[16px] font-bold text-neutral-900 leading-tight mb-1">
                {agent.counterName}
              </h4>
              <p className="text-[12px] text-neutral-500 font-medium mb-3">
                Manager: {agent.agentName}
              </p>

              <div className="space-y-2 py-3 border-t border-b border-neutral-100 my-3 text-[13px]">
                <div className="flex items-center gap-2 text-neutral-700">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{agent.location}, {agent.district}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-mono font-medium">{agent.phone}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Percent className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Comm: {agent.commissionRate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-semibold text-neutral-900">{agent.ticketsSoldMonth}</span> sold / mo
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`tel:${agent.phone}`}
                className="text-[13px] font-bold text-[#7A1D1B] hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Counter</span>
              </a>
              <span className="text-[11px] text-neutral-400">
                Partner since {agent.joinedDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
