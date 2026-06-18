import * as React from "react"

import { useForcedOffline } from "@/lib/demo-mode"

/**
 * Tracks connectivity. SSR-safe: assumes online until mounted, then mirrors
 * `navigator.onLine` and the online/offline events (toggle Wi-Fi or DevTools
 * "Offline"). Also honours the in-app "Simulate offline" demo control.
 */
export function useOnlineStatus() {
  const [browserOnline, setBrowserOnline] = React.useState(true)
  const forcedOffline = useForcedOffline()

  React.useEffect(() => {
    const update = () => setBrowserOnline(navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  return browserOnline && !forcedOffline
}
