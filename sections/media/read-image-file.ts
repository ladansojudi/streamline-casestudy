"use client"

/**
 * Read an image File and return a downscaled JPEG data URL. Capping the size
 * keeps the (localStorage-backed) store from bloating with full-res uploads.
 */
export async function readImageFile(
  file: File,
  maxWidth = 640
): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = objectUrl
    })

    const scale = Math.min(1, maxWidth / img.width)
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
