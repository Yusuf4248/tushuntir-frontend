/** Photos for upload: HEIC/HEIF and large images become JPEG, at most 2000 px on the long side. */
const MAX_SIDE = 2000
const KEEP_IF_UNDER = 1.5 * 1024 * 1024
const QUALITY = 0.85

const isHeic = (file: File) =>
  /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // Fall back to <img>, which Safari uses for HEIC.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Returns the file unchanged when it is a small jpg/png/webp/gif; otherwise a JPEG. Throws if unreadable. */
export async function prepareImage(file: File): Promise<File> {
  const gif = file.type === 'image/gif'
  if (!isHeic(file) && (gif || file.size <= KEEP_IF_UNDER)) return file
  const image = await decode(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.fillStyle = '#fff' // transparent PNGs get a white background in JPEG
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  )
  if (!blob) throw new Error('encode failed')
  const name = file.name.replace(/\.[^.]+$/, '') || 'rasm'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}
