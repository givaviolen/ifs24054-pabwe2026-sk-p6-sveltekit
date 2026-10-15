import { writable, type Writable } from "svelte/store";

export interface UseInput {
  value: Writable<string>;
  reset: () => void;
}

/** Hook input formulir berbasis Svelte store. */
export function useInput(initialValue: string): UseInput {
  const value = writable(initialValue);
  const reset = () => value.set(initialValue);
  return { value, reset };
}
