"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { seedPeople, type Person, type Role } from "@/data/schema"

export type { Role }

export type Persona = Person & { label: string }

/** The signed-in user for each role, sourced from the people table. */
function personaForRole(role: Role): Persona {
  const person = seedPeople.find((p) => p.role === role)!
  return { ...person, label: role === "editor" ? "Editor" : "Publisher" }
}

export const personas: Record<Role, Persona> = {
  editor: personaForRole("editor"),
  publisher: personaForRole("publisher"),
}

const STORAGE_KEY = "insider-one:role"

type RoleContextValue = {
  role: Role
  persona: Persona
  setRole: (role: Role) => void
  toggleRole: () => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("editor")

  // Hydrate the persisted role from localStorage after mount. We can't read it
  // during render (it isn't available on the server), so syncing from this
  // external store in an effect is the intended pattern here.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "editor" || stored === "publisher") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleState(stored)
    }
  }, [])

  const setRole = (next: Role) => {
    setRoleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const toggleRole = () => setRole(role === "editor" ? "publisher" : "editor")

  return (
    <RoleContext.Provider
      value={{ role, persona: personas[role], setRole, toggleRole }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return ctx
}
