/** The canonical genre list, shared by every title form. */
export const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "History",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const

/** Split a stored comma-joined genre string into an array. */
export function splitGenres(g: string): string[] {
  return g
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}
