"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useTitles } from "@/data/hooks"

function toLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  // Resolve a title id in the path (e.g. /content-studio/t_xxxx) to its real
  // name, so the crumb reads "Content Studio › Money Heist", not a raw id.
  const { data: titles = [] } = useTitles()
  const titleName = (segment: string) =>
    titles.find((t) => t.id === segment)?.name ?? toLabel(segment)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/">Dashboard</Link>} />
          )}
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{titleName(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={href}>{titleName(segment)}</Link>}
                  />
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
