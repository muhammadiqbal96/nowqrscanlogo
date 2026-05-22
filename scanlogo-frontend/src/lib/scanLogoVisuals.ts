const FALLBACK_COLOR = '#111111'

type Rgb = { r: number; g: number; b: number }

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value))
}

function normalizeHex(color: string): string | null {
    if (!color) return null
    const trimmed = color.trim()
    const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (!hexMatch) return null

    const hexValue = hexMatch[1]
    if (hexValue.length === 3) {
        return `#${hexValue
            .split('')
            .map(ch => `${ch}${ch}`)
            .join('')
            .toLowerCase()}`
    }

    return `#${hexValue.toLowerCase()}`
}

function toRgb(color: string): Rgb | null {
    const hex = normalizeHex(color)
    if (!hex) return null

    return {
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16),
    }
}

function linearize(channel: number): number {
    const srgb = channel / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
}

function luminance(color: string): number | null {
    const rgb = toRgb(color)
    if (!rgb) return null

    return (0.2126 * linearize(rgb.r)) + (0.7152 * linearize(rgb.g)) + (0.0722 * linearize(rgb.b))
}

function contrastRatio(colorA: string, colorB: string): number {
    const lumA = luminance(colorA)
    const lumB = luminance(colorB)
    if (lumA === null || lumB === null) return 1

    const lighter = Math.max(lumA, lumB)
    const darker = Math.min(lumA, lumB)
    return (lighter + 0.05) / (darker + 0.05)
}

function rgbToHex(rgb: Rgb): string {
    const toChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
    return `#${toChannel(rgb.r)}${toChannel(rgb.g)}${toChannel(rgb.b)}`
}

function mixColors(baseColor: string, blendColor: string, blendAmount: number): string {
    const base = toRgb(baseColor)
    const blend = toRgb(blendColor)
    if (!base || !blend) return baseColor

    const amount = clamp01(blendAmount)

    return rgbToHex({
        r: (base.r * (1 - amount)) + (blend.r * amount),
        g: (base.g * (1 - amount)) + (blend.g * amount),
        b: (base.b * (1 - amount)) + (blend.b * amount),
    })
}

export function colorWithAlpha(color: string, alpha: number): string {
    const rgb = toRgb(color)
    if (!rgb) return `rgba(200, 64, 26, ${clamp01(alpha)})`
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp01(alpha)})`
}

function getReadableTextColor(backgroundColor: string): string {
    return contrastRatio(backgroundColor, '#ffffff') >= contrastRatio(backgroundColor, '#0f172a')
        ? '#ffffff'
        : '#0f172a'
}

function getReadableColorForBackground(preferredColor: string, backgroundColor: string, minContrast = 3): string {
    if (contrastRatio(preferredColor, backgroundColor) >= minContrast) {
        return preferredColor
    }

    return getReadableTextColor(backgroundColor)
}

export function getScanLogoVisuals(color?: string, wrapperColor?: string) {
    const resolvedColor = normalizeHex(color || '') || FALLBACK_COLOR
    const resolvedWrapperColor = normalizeHex(wrapperColor || '') || resolvedColor

    const qrLum = luminance(resolvedColor) ?? 0.3
    const wrapperLum = luminance(resolvedWrapperColor) ?? 0.3

    const isQrVeryLight = qrLum >= 0.85
    const isQrVeryDark = qrLum <= 0.1
    const isWrapperVeryLight = wrapperLum >= 0.85

    // Keep very light wrapper themes visible on light page backgrounds.
    const tonedWrapperColor = isWrapperVeryLight
        ? mixColors(resolvedWrapperColor, '#94a3b8', 0.38)
        : resolvedWrapperColor

    // QR core stays high-contrast and static for scan reliability.
    const qrBgColor = '#ffffff'
    const qrFgColor = getReadableColorForBackground(resolvedColor, qrBgColor, 4.5)

    const shapeStrokeColor = isQrVeryLight
        ? '#1e293b'
        : isQrVeryDark
            ? '#f8fafc'
            : colorWithAlpha(resolvedColor, 0.92)

    const contrastStrokeColor = isQrVeryLight
        ? 'rgba(15, 23, 42, 0.52)'
        : isQrVeryDark
            ? 'rgba(255, 255, 255, 0.74)'
            : colorWithAlpha(resolvedColor, 0.58)

    // Keep shape color visibly tied to the QR+shape picker selection.
    const shapeFillColor = isQrVeryLight
        ? colorWithAlpha(resolvedColor, 0.36)
        : colorWithAlpha(resolvedColor, 0.44)

    const shapeFillStrongColor = isQrVeryLight
        ? colorWithAlpha(resolvedColor, 0.52)
        : colorWithAlpha(resolvedColor, 0.62)

    const wrapperGradientStart = isWrapperVeryLight
        ? colorWithAlpha(tonedWrapperColor, 0.92)
        : colorWithAlpha(tonedWrapperColor, 0.98)

    const wrapperGradientEnd = isWrapperVeryLight
        ? colorWithAlpha(tonedWrapperColor, 0.72)
        : colorWithAlpha(tonedWrapperColor, 0.76)

    const wrapperAccentColor = isWrapperVeryLight ? '#0f172a' : '#facc15'
    const wrapperInnerRingColor = isWrapperVeryLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(15, 23, 42, 0.12)'
    const wrapperTopTextColor = getReadableTextColor(tonedWrapperColor)
    const bubbleColor = isWrapperVeryLight
        ? 'rgba(15, 23, 42, 0.18)'
        : colorWithAlpha(tonedWrapperColor, 0.34)

    const orbitStrokeColor = wrapperTopTextColor === '#0f172a'
        ? 'rgba(255, 255, 255, 0.66)'
        : 'rgba(15, 23, 42, 0.5)'

    return {
        resolvedColor,
        resolvedWrapperColor,
        qrBgColor,
        qrFgColor,
        shapeFillColor,
        shapeFillStrongColor,
        glowColor: isWrapperVeryLight
            ? 'rgba(15, 23, 42, 0.45)'
            : colorWithAlpha(tonedWrapperColor, 0.4),
        flashTextColor: getReadableTextColor(tonedWrapperColor),
        labelTextColor: isQrVeryLight ? '#0f172a' : resolvedColor,
        labelTextColorLightBg: getReadableColorForBackground(resolvedColor, '#ffffff', 3),
        labelTextColorDarkBg: getReadableColorForBackground(resolvedColor, '#0b1220', 3),
        shapeStrokeColor,
        contrastStrokeColor,
        labelTextShadow: isQrVeryLight ? '0 1px 2px rgba(255, 255, 255, 0.35)' : 'none',
        wrapperGradientStart,
        wrapperGradientEnd,
        wrapperAccentColor,
        wrapperInnerRingColor,
        wrapperTopTextColor,
        orbitStrokeColor,
        bubbleColor,
    }
}

export function getQrScaleForShape(shape?: string): number {
    const normalizedShape = (shape || '').toLowerCase()

    // Keep QR fully inside each shape border while preserving scan reliability.
    if (normalizedShape === 'square') return 0.74
    if (normalizedShape === 'circle') return 0.7
    if (normalizedShape === 'hexagon') return 0.66
    if (normalizedShape === 'shield') return 0.64
    if (normalizedShape === 'diamond') return 0.58
    if (normalizedShape === 'gear') return 0.6
    if (normalizedShape === 'eye') return 0.54
    if (normalizedShape === 'drum') return 0.64
    if (normalizedShape === 'tv') return 0.64

    return 0.62
}

export function getShapeFrameScale(shape?: string): number {
    const normalizedShape = (shape || '').toLowerCase()

    // Grow frame for constrained shapes so QR sits comfortably inside the border.
    if (normalizedShape === 'square') return 1
    if (normalizedShape === 'circle') return 1.1
    if (normalizedShape === 'hexagon') return 1.18
    if (normalizedShape === 'shield') return 1.22
    if (normalizedShape === 'diamond') return 1.2
    if (normalizedShape === 'gear') return 1.24
    if (normalizedShape === 'eye') return 1.2
    if (normalizedShape === 'drum') return 1.22
    if (normalizedShape === 'tv') return 1.2

    return 1.16
}

type FlashTextLayout = {
    fontSizePx: number
    maxWidthPercent: number
    letterSpacingEm: number
}

function getFlashTextWidthPercent(shape?: string): number {
    const normalizedShape = (shape || '').toLowerCase()

    if (normalizedShape === 'square') return 72
    if (normalizedShape === 'circle') return 78
    if (normalizedShape === 'hexagon') return 72
    if (normalizedShape === 'shield') return 66
    if (normalizedShape === 'diamond') return 64
    if (normalizedShape === 'gear') return 62
    if (normalizedShape === 'eye') return 60
    if (normalizedShape === 'drum') return 68
    if (normalizedShape === 'tv') return 72

    return 68
}

function getFlashTextShapeScale(shape?: string): number {
    const normalizedShape = (shape || '').toLowerCase()

    if (normalizedShape === 'square') return 0.84
    if (normalizedShape === 'circle') return 0.96
    if (normalizedShape === 'hexagon') return 0.92
    if (normalizedShape === 'shield') return 0.88
    if (normalizedShape === 'diamond') return 0.86
    if (normalizedShape === 'gear') return 0.84
    if (normalizedShape === 'eye') return 0.82
    if (normalizedShape === 'drum') return 0.84
    if (normalizedShape === 'tv') return 0.9

    return 0.9
}

export function getFlashTextLayout(shape?: string, size = 200, text = ''): FlashTextLayout {
    const normalizedText = (text || '').trim().replace(/\s+/g, ' ')
    const charCount = normalizedText.length

    const baseFontSize = size <= 60 ? 8 : size <= 120 ? 12 : 18
    const shapeScale = getFlashTextShapeScale(shape)

    let textLengthScale = 1
    if (charCount > 10) textLengthScale = 0.94
    if (charCount > 14) textLengthScale = 0.88
    if (charCount > 20) textLengthScale = 0.8
    if (charCount > 28) textLengthScale = 0.72

    const fontSizePx = Math.max(8, Math.round(baseFontSize * shapeScale * textLengthScale))
    const letterSpacingEm = charCount > 14 ? 0.06 : 0.08

    return {
        fontSizePx,
        maxWidthPercent: getFlashTextWidthPercent(shape),
        letterSpacingEm,
    }
}
