import { TitleDetailView } from "@/sections/library/view/title-detail-view"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TitleDetailView titleId={id} />
}
