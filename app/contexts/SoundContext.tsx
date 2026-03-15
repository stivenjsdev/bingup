"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

// Valor por defecto para evitar errores cuando el contexto no está listo
const defaultValue: SoundContextType = {
  soundEnabled: true,
  toggleSound: () => {},
  setSoundEnabled: () => {},
};

const SoundContext = createContext<SoundContextType>(defaultValue);

const STORAGE_KEY = "bingup:soundEnabled";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);

  // Cargar preferencia de sonido desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSoundEnabledState(stored === "true");
    }
  }, []);

  // Guardar preferencia en localStorage
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled, setSoundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, setSoundEnabled }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  return useContext(SoundContext);
}
