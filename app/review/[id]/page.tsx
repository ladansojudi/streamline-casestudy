import { ReviewDetailView } from "@/sections/review/view/review-detail-view"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ReviewDetailView episodeId={id} />
}
