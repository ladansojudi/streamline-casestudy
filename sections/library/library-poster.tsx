"use client"

import { useState } from "react"
import Image from "next/image"
import { Film } from "lucide-react"

import { cn } from "@/lib/utils"
import { posterUrl } from "@/data/db"

/** Small title poster with a graceful fallback if the image is missing/fails. */
export function LibraryPoster({
  poster,
  name,
  className,
}: {
  poster: string | null
  name: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  const src = posterUrl(poster, "w185")

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded bg-muted ring-1 ring-foreground/10",
        className
      )}
    >
      {src && !errored ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="36px"
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Film className="size-4" />
        </div>
      )}
    </div>
  )
}
