"use client";

import React from "react";
import { Calendar } from "lucide-react";
import type { StaffMember } from "../staff-contract";

interface CrewUpcomingDeparturesCardProps {
  staff: StaffMember;
}

export function CrewUpcomingDeparturesCard({
  staff,
}: CrewUpcomingDeparturesCardProps) {
  const isDriver = staff.role === "driver";
  const trips = staff.assignedTrips || [];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Card Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <Calendar className="size-4 text-[#7A1D1B]" />
          <span>Upcoming Departures</span>
        </div>

        <span className="text-xs text-[#746E69] font-medium">
          {trips.length} upcoming
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-[#EDE7E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EDE7E0] bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                <th className="px-4 py-2.5">Date &amp; time</th>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-3 py-2.5">Bus</th>
                <th className="px-3 py-2.5">Service</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            {trips.length > 0 ? (
              <tbody className="divide-y divide-[#EDE7E0]">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="px-4 py-3 font-semibold text-[#111111]">
                      {trip.tripDate} · {trip.departureTime}
                    </td>
                    <td className="px-4 py-3 text-[#554E48]">
                      {trip.route?.name || "Scheduled route"}
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#111111]">
                      {trip.bus?.number || trip.bus?.name || staff.assignedBusNumber || "—"}
                    </td>
                    <td className="px-3 py-3 text-[#746E69]">Express</td>
                    <td className="px-3 py-3 capitalize text-[#111111]">
                      {isDriver ? "Primary driver" : "Conductor"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded-md bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-semibold text-[#554E48] border border-[#EDE7E0]">
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <p className="text-xs sm:text-sm font-bold text-[#111111]">
                      No upcoming departures
                    </p>
                    <p className="text-xs text-[#746E69] mt-0.5">
                      Upcoming {isDriver ? "driving" : "boarding"} duties will appear here once assigned.
                    </p>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
