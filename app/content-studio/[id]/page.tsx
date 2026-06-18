import { ContentStudioView } from "@/sections/content-studio/view/content-studio-view"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContentStudioView initialTitleId={id} />
}
