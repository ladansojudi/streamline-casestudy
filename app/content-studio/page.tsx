import { ContentStudioView } from "@/sections/content-studio/view/content-studio-view"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const sp = await searchParams
  return <ContentStudioView initialTitleId={null} autoNewTitle={sp?.new === "1"} />
}
