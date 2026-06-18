"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronsUpDown,
  Clapperboard,
  LogOut,
  RotateCcw,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { personas, useRole, type Role } from "@/layouts/role-context"
import { ResetDataDialog } from "@/layouts/reset-data-dialog"

const roleIcon: Record<Role, typeof Clapperboard> = {
  editor: Clapperboard,
  publisher: ShieldCheck,
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { role, persona, setRole } = useRole()
  const RoleIcon = roleIcon[role]
  const [resetOpen, setResetOpen] = useState(false)

  // Switching role drops you on that role's dashboard.
  const switchRole = (next: Role) => {
    if (next === role) return
    setRole(next)
    router.push("/")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-md after:rounded-md">
                  <AvatarFallback className="rounded-md">
                    {persona.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{persona.name}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <RoleIcon className="size-3" />
                    {persona.label}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="min-w-64"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="grid text-sm leading-tight">
                  <span className="truncate font-medium">{persona.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {persona.email}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Role switch */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Switch role
              </DropdownMenuLabel>
              {(Object.keys(personas) as Role[]).map((key) => {
                const p = personas[key]
                const Icon = roleIcon[key]
                const active = key === role
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => switchRole(key)}
                    className={cn(active && "bg-accent text-accent-foreground")}
                  >
                    <Icon />
                    <div className="grid flex-1 leading-tight">
                      <span className="text-sm">{p.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.tagline}
                      </span>
                    </div>
                    {active ? <Check className="size-4" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserRound />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setResetOpen(true)}>
                <RotateCcw />
                Reset demo data
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <ResetDataDialog open={resetOpen} onOpenChange={setResetOpen} />
    </SidebarMenu>
  )
}
