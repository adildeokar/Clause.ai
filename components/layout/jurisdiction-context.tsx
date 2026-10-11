"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  DEFAULT_JURISDICTION,
  toJurisdictionCode,
  type JurisdictionCode,
} from "@/config/jurisdictions";

interface JurisdictionContextValue {
  /** The user's working jurisdiction: the default for uploads, drafting and generation. */
  jurisdiction: JurisdictionCode;
  setJurisdiction: (code: JurisdictionCode) => void;
}

const JurisdictionContext = createContext<JurisdictionContextValue>({
  jurisdiction: DEFAULT_JURISDICTION,
  setJurisdiction: () => {},
});

export function useWorkingJurisdiction() {
  return useContext(JurisdictionContext);
}

/** Loads the working jurisdiction from the user's profile and saves changes back. */
export function JurisdictionProvider({ children }: { children: React.ReactNode }) {
  const [jurisdiction, setState] = useState<JurisdictionCode>(DEFAULT_JURISDICTION);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => profile && setState(toJurisdictionCode(profile.jurisdiction)))
      .catch(() => {});
  }, []);

  const setJurisdiction = useCallback((code: JurisdictionCode) => {
    setState(code);
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jurisdiction: code }),
    }).catch(() => {});
  }, []);

  return (
    <JurisdictionContext.Provider value={{ jurisdiction, setJurisdiction }}>
      {children}
    </JurisdictionContext.Provider>
  );
}
