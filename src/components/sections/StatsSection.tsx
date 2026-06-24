import StatCounter from "@/components/ui/StatCounter";
import { StatItem } from "@/types";

const stats: StatItem[] = [
  {
    id: "operators",
    end: 250,
    suffix: "+",
    duration: 1500,
    label: "Verified Bus Operators",
    accentColor: true,
  },
  {
    id: "travelers",
    end: 500000,
    suffix: "+",
    duration: 2000,
    label: "Passengers Booking Monthly",
  },
  {
    id: "share",
    end: 72,
    suffix: "%",
    duration: 1500,
    label: "Nepal Online Ticket Share",
  },
  {
    id: "value",
    end: 10,
    prefix: "Rs. ",
    suffix: " Cr+",
    duration: 1500,
    label: "Total Monthly Bookings Value",
  },
];

export default function StatsSection() {
  return (
    <section
      id="statistics"
      className="scroll-mt-24 py-10 px-8 md:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center bg-white rounded-2xl border border-neutral-200"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      {stats.map((stat) => (
        <div key={stat.id}>
          <StatCounter
            end={stat.end}
            prefix={stat.prefix}
            suffix={stat.suffix}
            duration={stat.duration}
            className={`text-4xl md:text-5xl font-bold block ${
              stat.accentColor ? "text-maroon" : "text-neutral-900"
            }`}
          />
          <p className="text-neutral-500 text-xs md:text-sm font-medium mt-2">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  );
}
