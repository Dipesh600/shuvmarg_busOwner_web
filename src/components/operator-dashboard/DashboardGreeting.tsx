"use client";

import React, { useEffect, useState } from "react";
import PremiumDatePicker from "./PremiumDatePicker";

interface DashboardGreetingProps {
  ownerName?: string | null;
}

export default function DashboardGreeting({ ownerName }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const firstName = ownerName ? ownerName.trim().split(" ")[0] : "Operator";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#161311] tracking-tight"
          style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
        >
          {greeting},{" "}
          <span className="text-[#D96861]">{firstName}</span>,
        </h1>
        <p className="text-xs sm:text-sm text-[#746E69] mt-0.5 font-medium">
          Complete your business setup, prepare your fleet and unlock live operations.
        </p>
      </div>

      {/* Custom Built Interactive Premium Date Picker */}
      <PremiumDatePicker />
    </div>
  );
}
