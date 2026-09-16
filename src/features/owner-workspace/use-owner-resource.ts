"use client";
import { useEffect, useState } from "react";
import { readOwnerData } from "./api";
import { subscribeToDataRefresh } from "@/lib/data-refresh";
import { isLoggedIn, subscribeToAuthChanges } from "@/lib/auth";
export function useOwnerResource<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: string | null }>({ path: null, data: null, error: null });
  useEffect(() => {
    if (!path) return;
    let active = true, generation = 0;
    const load = async () => {
      const current = ++generation;
      try {
        const data = await readOwnerData<T>(path);
        if (active && generation === current) setState({ path, data, error: null });
      } catch (cause) {
        if (active && generation === current) setState(previous => ({ path, data: previous.path === path ? previous.data : null,
          error: cause instanceof Error ? cause.message : "Unable to load operator data." }));
      }
    };
    void load();
    const unsubscribeRefresh = subscribeToDataRefresh(() => { void load(); });
    const unsubscribeAuth = subscribeToAuthChanges(() => {
      generation++;
      setState({ path: null, data: null, error: null });
      if (isLoggedIn()) void load();
    });
    return () => { active = false; unsubscribeRefresh(); unsubscribeAuth(); };
  }, [path]);
  return { data: state.path === path ? state.data : null, error: state.path === path ? state.error : null,
    loading: Boolean(path && state.path !== path) };
}
