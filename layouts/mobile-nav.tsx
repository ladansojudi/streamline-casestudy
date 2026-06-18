"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Hexagon, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { appMeta, getNavGroups, navSecondary } from "@/layouts/nav-config"
import { useRole } from "@/layouts/role-context"

export function MobileNav() {
  const pathname = usePathname()
  const { role } = useRole()
  const navGroups = getNavGroups(role)
  const [open, setOpen] = useState(false)

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hexagon className="size-4" />
            </div>
            <span>{appMeta.name}</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-4 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(item.url) &&
                      "bg-accent font-medium text-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-auto flex flex-col gap-1 border-t pt-3">
            {navSecondary.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive(item.url) &&
                    "bg-accent font-medium text-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
