"use client";

import React, { Suspense } from "react";
import SettingsLayout from "@/components/dashboard/settings/SettingsLayout";

export default function SettingsPage() {
  return (
    <div className="min-h-full w-full">
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6 p-8">
            <div className="w-full md:w-64 h-64 bg-white rounded-[24px] border border-[#E8E1DB] animate-pulse" />
            <div className="flex-1 h-96 bg-white rounded-[24px] border border-[#E8E1DB] animate-pulse" />
          </div>
        }
      >
        <SettingsLayout />
      </Suspense>
    </div>
  );
}
