import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_NICHE_ID, getNicheConfig, NICHES, type NicheConfig, type NicheId } from "./niche";

interface NicheContextType {
  nicheId: NicheId;
  currentNiche: NicheConfig;
  setNicheId: (id: NicheId) => void;
  allNiches: NicheConfig[];
}

const STORAGE_KEY = "fuelrewards_selected_niche";

const NicheContext = createContext<NicheContextType | undefined>(undefined);

export function NicheProvider({ children }: { children: React.ReactNode }) {
  const [nicheId, setNicheState] = useState<NicheId>(DEFAULT_NICHE_ID);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in NICHES) {
        setNicheState(stored as NicheId);
      }
    } catch {
      // Ignora erro em ambientes sem localStorage
    }
  }, []);

  const setNicheId = (id: NicheId) => {
    setNicheState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignora
    }
  };

  const currentNiche = getNicheConfig(nicheId);
  const allNiches = Object.values(NICHES);

  return (
    <NicheContext.Provider value={{ nicheId, currentNiche, setNicheId, allNiches }}>
      {children}
    </NicheContext.Provider>
  );
}

export function useNiche(): NicheContextType {
  const context = useContext(NicheContext);
  if (!context) {
    // Retorno de fallback seguro caso chamado fora de um Provider
    return {
      nicheId: DEFAULT_NICHE_ID,
      currentNiche: getNicheConfig(DEFAULT_NICHE_ID),
      setNicheId: () => {},
      allNiches: Object.values(NICHES),
    };
  }
  return context;
}
