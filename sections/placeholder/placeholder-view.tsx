import { Construction } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function PlaceholderView({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Construction className="size-6" />
          </span>
          <div className="grid gap-1">
            <p className="font-medium">This section is coming soon</p>
            <p className="text-sm text-muted-foreground">
              The {title} page is part of the case study scope.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
