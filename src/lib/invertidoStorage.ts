import { useCallback, useEffect, useState } from "react";
import { parseMoneyInput } from "./moneyCalc";

export const INVERTIDO_STORAGE_KEY = "bondia_invertido";

export function readInvertido(): number {
  if (typeof window === "undefined") return 0;
  const saved = localStorage.getItem(INVERTIDO_STORAGE_KEY);
  if (saved == null) return 0;
  return parseMoneyInput(saved) ?? 0;
}

export function writeInvertido(value: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INVERTIDO_STORAGE_KEY, String(value));
}

export function useInvertido() {
  const [invertido, setInvertido] = useState(0);

  useEffect(() => {
    setInvertido(readInvertido());
  }, []);

  const saveInvertido = useCallback((value: number) => {
    setInvertido(value);
    writeInvertido(value);
  }, []);

  return { invertido, saveInvertido };
}
