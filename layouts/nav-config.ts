import {
  LayoutDashboard,
  Clapperboard,
  Library,
  Images,
  Users,
  CalendarClock,
  ListChecks,
  ClipboardCheck,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react"

import type { Role } from "@/data/schema"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

// Editor (Eren) produces content: build, structure, metadata, artwork.
const editorNav: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Produce",
    items: [
      { title: "Content Studio", url: "/content-studio", icon: Clapperboard },
      { title: "Media", url: "/media", icon: Images },
      { title: "Audiences", url: "/audiences", icon: Users },
    ],
  },
  {
    label: "Workspace",
    items: [{ title: "Tasks", url: "/tasks", icon: ListChecks }],
  },
]

// Publisher (Maya) reviews & ships — no content-production tools.
const publisherNav: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Review",
    items: [
      { title: "Review", url: "/review", icon: ClipboardCheck },
      { title: "Library", url: "/library", icon: Library },
    ],
  },
  {
    label: "Deliver",
    items: [
      { title: "Schedule", url: "/schedule", icon: CalendarClock },
      { title: "Tasks", url: "/tasks", icon: ListChecks },
    ],
  },
]

export function getNavGroups(role: Role): NavGroup[] {
  return role === "publisher" ? publisherNav : editorNav
}

export const navSecondary: NavItem[] = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
]

export const appMeta = {
  name: "Insider One",
  plan: "Studio",
}
