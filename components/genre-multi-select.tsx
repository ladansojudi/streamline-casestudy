"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { GENRES } from "@/data/genres"

/** Multi-select for genres, built on the Base UI Combobox (shadcn). */
export function GenreMultiSelect({
  value,
  onChange,
  className,
}: {
  value: string[]
  onChange: (genres: string[]) => void
  className?: string
}) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      multiple
      autoHighlight
      items={GENRES as readonly string[]}
      value={value}
      onValueChange={(v) => onChange(v as string[])}
    >
      <ComboboxChips ref={anchor} className={className}>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((g) => (
                <ComboboxChip key={g}>{g}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={value.length ? "" : "Add genres…"} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No genres found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
