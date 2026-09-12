/**
 * Rasterize a live <svg> to a downloaded PNG. The plan's colors are set via
 * CSS custom properties (var(--color-...)) so the app's theme stays the
 * single source of truth — but an <img>-rendered SVG doesn't inherit the host
 * page's CSS variables, so those need resolving to literal colors first.
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

export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, pixelScale = 2): void {
  const clone = svg.cloneNode(true) as SVGSVGElement
  bakeComputedColors(svg, clone)

  const viewBox = svg.viewBox.baseVal
  const width = viewBox.width || svg.clientWidth
  const height = viewBox.height || svg.clientHeight
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const svgString = new XMLSerializer().serializeToString(clone)
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
      if (!blob) return
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    }, 'image/png')
  }
  img.src = svgUrl
}
