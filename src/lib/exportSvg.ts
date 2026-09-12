/**
 * Export a live <svg> as PNG, SVG, or a print dialog (Save as PDF from there —
 * generating a real PDF client-side would mean a new dependency; the browser
 * print pipeline already does it for free). The plan's colors are set via CSS
 * custom properties (var(--color-...)) so the app's theme stays the single
 * source of truth — but none of these destinations inherit the host page's
 * CSS variables, so those need resolving to literal colors first.
 */
function bakeComputedColors(live: SVGSVGElement, clone: SVGSVGElement) {
  const liveEls = live.querySelectorAll<SVGElement>('*')
  const cloneEls = clone.querySelectorAll<SVGElement>('*')
  liveEls.forEach((el, i) => {
    const target = cloneEls[i]
    if (!target) return
    const cs = getComputedStyle(el)
    if (el.hasAttribute('fill')) target.setAttribute('fill', cs.fill)
    if (el.hasAttribute('stroke')) target.setAttribute('stroke', cs.stroke)
  })
}

function serializeSvg(svg: SVGSVGElement): { svgString: string; width: number; height: number } {
  const clone = svg.cloneNode(true) as SVGSVGElement
  bakeComputedColors(svg, clone)

  const viewBox = svg.viewBox.baseVal
  const width = viewBox.width || svg.clientWidth
  const height = viewBox.height || svg.clientHeight
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  return { svgString: new XMLSerializer().serializeToString(clone), width, height }
}

function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, pixelScale = 2): void {
  const { svgString, width, height } = serializeSvg(svg)
  const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }))

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = width * pixelScale
    canvas.height = height * pixelScale
    const ctx = canvas.getContext('2d')
    URL.revokeObjectURL(svgUrl)
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename)
    }, 'image/png')
  }
  img.src = svgUrl
}

export function downloadSvgAsSvgFile(svg: SVGSVGElement, filename: string): void {
  const { svgString } = serializeSvg(svg)
  triggerDownload(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), filename)
}

/** Opens a print-ready tab with just the plan — "Save as PDF" is the browser's own print destination. */
export function printSvgAsPdf(svg: SVGSVGElement, docTitle: string): void {
  const { svgString } = serializeSvg(svg)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return
  win.document.write(`<!doctype html>
<html>
<head>
<title>${docTitle}</title>
<style>
  @page { margin: 32px; }
  html, body { margin: 0; height: 100%; display: flex; align-items: center; justify-content: center; background: #fff; }
  svg { max-width: 100%; max-height: 100vh; }
</style>
</head>
<body>${svgString}</body>
</html>`)
  win.document.close()
  win.focus()
  // Some browsers paint the injected document a beat after `document.close()`.
  setTimeout(() => win.print(), 300)
}
