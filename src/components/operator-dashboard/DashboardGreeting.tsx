"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface DashboardGreetingProps {
  ownerName?: string | null;
}

export default function DashboardGreeting({ ownerName }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Welcome");
  const [currentDateString, setCurrentDateString] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    const formattedDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDateString(formattedDate);
  }, []);

  const firstName = ownerName ? ownerName.trim().split(" ")[0] : "Operator";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#161311] tracking-tight"
          style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
        >
          {greeting}, {firstName}.
        </h1>
        <p className="text-xs sm:text-sm text-[#746E69] mt-0.5 font-medium">
          Complete your business setup, prepare your fleet and unlock live operations.
        </p>
      </div>

      <div className="text-xs font-semibold text-[#746E69] bg-white px-3.5 py-2 rounded-2xl border border-[#EEE8E2] shadow-2xs self-start sm:self-auto flex items-center gap-2.5">
        <Image
          src="/operator-dashboard/icons/calendar-doodle.svg"
          alt="Calendar"
          width={18}
          height={18}
          className="flex-shrink-0"
        />
        <span>{currentDateString || "Today"}</span>
      </div>
    </div>
  );
}
