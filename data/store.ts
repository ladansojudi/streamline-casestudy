/**
 * Mutable store (isomorphic).
 *
 * The data/*.json files are immutable SEED data. On first load we snapshot them
 * into localStorage; all add/edit/delete operations read and write that copy,
 * leaving the seed pristine. Seed rows are protected from deletion. Clearing the
 * `insider-one:db` localStorage key (or calling resetStore) restores the seed.
 *
 * CRUD functions are async so React Query can wrap them like a real API.
 */
import {
  seedActivity,
  seedComments,
  seedEpisodes,
  seedMedia,
  seedPeople,
  seedSeasons,
  seedSegments,
  seedThumbnails,
  seedTitles,
  seedUploads,
  type ActivityEvent,
  type Comment,
  type Episode,
  type Media,
  type Person,
  type Season,
  type Segment,
  type Thumbnail,
  type Title,
  type Upload,
} from "./schema"

export type DbState = {
  people: Person[]
  titles: Title[]
  seasons: Season[]
  episodes: Episode[]
  uploads: Upload[]
  segments: Segment[]
  thumbnails: Thumbnail[]
  comments: Comment[]
  activity: ActivityEvent[]
  media: Media[]
}

export type TableName = keyof DbState

const STORAGE_KEY = "insider-one:db"

function seedState(): DbState {
  return structuredClone({
    people: seedPeople,
    titles: seedTitles,
    seasons: seedSeasons,
    episodes: seedEpisodes,
    uploads: seedUploads,
    segments: seedSegments,
    thumbnails: seedThumbnails,
    comments: seedComments,
    activity: seedActivity,
    media: seedMedia,
  })
}

/** Ids present in the seed — these rows are protected from deletion. */
const SEED_IDS: Record<TableName, Set<string>> = (() => {
  const seed = seedState()
  const out = {} as Record<TableName, Set<string>>
  for (const table of Object.keys(seed) as TableName[]) {
    out[table] = new Set(seed[table].map((r) => (r as { id: string }).id))
  }
  return out
})()

export function isSeedRow(table: TableName, id: string): boolean {
  return SEED_IDS[table].has(id)
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

let memory: DbState | null = null

/**
 * Merge persisted state onto a fresh seed so that any table added AFTER the
 * user's localStorage was written (e.g. `seasons`, `media`) is filled in from
 * the seed instead of being `undefined`. Forward-compatible across schema bumps.
 */
function hydrate(raw: string): DbState {
  const seed = seedState()
  const parsed = JSON.parse(raw) as Partial<DbState>
  const out = seed
  for (const table of Object.keys(seed) as TableName[]) {
    const persisted = parsed[table]
    if (Array.isArray(persisted)) {
      // The persisted table wins (it holds the user's edits).
      out[table] = persisted as never
    }
  }
  return out
}

function read(): DbState {
  if (memory) return memory
  if (typeof window === "undefined") {
    // SSR / build: serve the seed (read-only); never persisted here.
    memory = seedState()
    return memory
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    memory = raw ? hydrate(raw) : seedState()
  } catch {
    memory = seedState()
  }
  return memory
}

function write(state: DbState): void {
  memory = state
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

export function getState(): DbState {
  return read()
}

export function resetStore(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }
  memory = seedState()
  write(memory)
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.abs(read().titles.length * 2654435761).toString(16)
  return `${prefix}_${uuid}`
}

export async function listTable<T extends TableName>(
  table: T
): Promise<DbState[T]> {
  return read()[table]
}

export async function createRow<T extends TableName>(
  table: T,
  prefix: string,
  row: Omit<DbState[T][number], "id"> & { id?: string }
): Promise<DbState[T][number]> {
  const state = read()
  const created = { ...row, id: row.id ?? newId(prefix) } as DbState[T][number]
  const next = { ...state, [table]: [created, ...state[table]] }
  write(next)
  return created
}

export async function updateRow<T extends TableName>(
  table: T,
  id: string,
  patch: Partial<DbState[T][number]>
): Promise<DbState[T][number] | null> {
  const state = read()
  const list = state[table] as DbState[T][number][]
  const index = list.findIndex((r) => (r as { id: string }).id === id)
  if (index === -1) return null
  const updated = { ...list[index], ...patch }
  const nextList = [...list]
  nextList[index] = updated
  write({ ...state, [table]: nextList })
  return updated
}

export type DeleteResult = "deleted" | "not-found" | "protected"

export async function deleteRow<T extends TableName>(
  table: T,
  id: string
): Promise<DeleteResult> {
  if (isSeedRow(table, id)) return "protected"
  const state = read()
  const list = state[table] as DbState[T][number][]
  const next = list.filter((r) => (r as { id: string }).id !== id)
  if (next.length === list.length) return "not-found"
  write({ ...state, [table]: next })
  return "deleted"
}
