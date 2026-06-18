"use client"

import { useSyncExternalStore } from "react"

/**
 * A tiny external store so the recruiter can trigger edge cases from inside the
 * app (no DevTools needed). Right now it just simulates losing the connection;
 * `useOnlineStatus` and the upload tick both honour it.
 */
let forcedOffline = false
const listeners = new Set<() => void>()

export const demoMode = {
  isForcedOffline: () => forcedOffline,
  setForcedOffline(value: boolean) {
    if (forcedOffline === value) return
    forcedOffline = value
    listeners.forEach((l) => l())
  },
  toggleOffline() {
    demoMode.setForcedOffline(!forcedOffline)
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useForcedOffline() {
  return useSyncExternalStore(
    demoMode.subscribe,
    () => forcedOffline,
    () => false
  )
}
