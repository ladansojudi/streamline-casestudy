"use client";

import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DemoPanel } from "@/layouts/demo-panel";
import { HeaderBreadcrumb } from "@/layouts/header-breadcrumb";
import { MobileNav } from "@/layouts/mobile-nav";
import { ModeToggle } from "@/layouts/mode-toggle";
import { TourPanel } from "@/layouts/tour-panel";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
      <SidebarTrigger className="-ml-1 hidden md:flex" />
      <MobileNav />
      <HeaderBreadcrumb />

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search…"
            className="h-8 w-40 pl-8 lg:w-56"
          />
        </div>
        <TourPanel />
        <DemoPanel />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
