"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchOperatorDashboardState, subscribeToOperatorDashboardState } from "./operator-dashboard-api";
import type { OperatorDashboardState } from "./operator-dashboard-contract";
import { isLoggedIn, subscribeToAuthChanges } from "@/lib/auth";
import { subscribeToDataRefresh } from "@/lib/data-refresh";

const SessionContext = createContext<{
  dashboardState: OperatorDashboardState | null;
  loading: boolean;
  error: string | null;
}>({ dashboardState: null, loading: true, error: null });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [dashboardState, setDashboardState] = useState<OperatorDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const load = () => {
      const current = ++generation;
      setError(null);
      if (!isLoggedIn()) {
        setDashboardState(null);
        setLoading(false);
        return;
      }
      void fetchOperatorDashboardState().then(state => {
        if (active && generation === current) setDashboardState(state);
      }).catch(cause => {
        if (active && generation === current) setError(cause instanceof Error ? cause.message : "Unable to load operator session.");
      }).finally(() => {
        if (active && generation === current) setLoading(false);
      });
    };
    load();
    const unsubscribeAuth = subscribeToAuthChanges(() => {
      setDashboardState(null);
      setLoading(true);
      load();
    });
    const unsubscribeRefresh = subscribeToDataRefresh(load);
    const unsubscribeDashboard = subscribeToOperatorDashboardState(state => {
      if (active) { setDashboardState(state); setError(null); }
    });
    return () => { active = false; unsubscribeAuth(); unsubscribeRefresh(); unsubscribeDashboard(); };
  }, []);
  return <SessionContext.Provider value={{ dashboardState, loading, error }}>{children}</SessionContext.Provider>;
}

export function useOperatorSession() { return useContext(SessionContext); }
