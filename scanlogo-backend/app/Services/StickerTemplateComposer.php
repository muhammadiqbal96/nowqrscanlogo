<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Turns a design brief (copy + palette + layout choice) into positioned canvas
 * elements for a print-sized sticker.
 *
 * Geometry is computed here rather than asked of the model on purpose: layout
 * maths is exactly what LLMs get subtly wrong, and on a sticker a misplaced QR
 * is not a cosmetic bug — it is an unscannable product that gets refunded.
 */
class StickerTemplateComposer
{
    public const LAYOUTS = ['qr-left', 'qr-right', 'band-left', 'centered'];

    /** 1/8" trim tolerance at 300 DPI. */
    private const SAFE_MARGIN_RATIO = 0.125;

    /**
     * A QR smaller than this cannot be relied on to scan from a moving car.
     */
    private const MIN_QR_INCHES = 0.8;

    /**
     * @param  array{headline?: string, subtitle?: string, cta_text?: string, colors?: array, font?: string, layout?: string}  $brief
     * @return array{elements: array, bgColor: string, aspectRatio: string, warnings: array}
     */
    public function compose(
        array $brief,
        int $canvasWidth,
        int $canvasHeight,
        int $dpi,
        string $aspectRatio,
        ?int $scanLogoId = null,
    ): array {
        $margin = (int) round(self::SAFE_MARGIN_RATIO * $dpi);
        $isSquare = $canvasHeight > 0 && ($canvasWidth / $canvasHeight) < 1.4;

        $layout = $brief['layout'] ?? 'qr-left';
        if (!in_array($layout, self::LAYOUTS, true)) {
            $layout = 'qr-left';
        }
        if ($isSquare) {
            $layout = 'centered';
        }

        $colors = $this->normalizeColors($brief['colors'] ?? []);
        $font = $brief['font'] ?? 'Inter';
        $headline = strtoupper(trim((string) ($brief['headline'] ?? 'SCAN ME')));
        $subtitle = trim((string) ($brief['subtitle'] ?? ''));
        $ctaText = trim((string) ($brief['cta_text'] ?? ''));

        $warnings = [];
        $elements = [];

        // Full-bleed background plate.
        $elements[] = $this->shape(0, 0, $canvasWidth, $canvasHeight, $colors['background'], 0, 1, true);

        if ($layout === 'centered') {
            return $this->composeCentered(
                $elements, $colors, $font, $headline, $subtitle,
                $canvasWidth, $canvasHeight, $margin, $dpi, $scanLogoId, $aspectRatio, $warnings
            );
        }

        // The white quiet-zone plate — not the QR — is what must sit inside the
        // safe margin, so size the plate to the safe area and inset the QR
        // within it. Sizing the QR first pushes the plate past the trim line.
        $plateSize = $canvasHeight - ($margin * 2);
        $platePad = (int) round($plateSize * 0.055);
        $qrSize = $plateSize - ($platePad * 2);

        $minQrPx = (int) round(self::MIN_QR_INCHES * $dpi);
        if ($qrSize < $minQrPx) {
            $warnings[] = 'QR is smaller than ' . self::MIN_QR_INCHES . '" and may not scan reliably.';
        }

        $qrOnLeft = $layout !== 'qr-right';
        $plateX = $qrOnLeft ? $margin : $canvasWidth - $margin - $plateSize;
        $plateY = $margin;

        if ($layout === 'band-left') {
            $bandW = $plateSize + ($margin * 2);
            $elements[] = $this->shape(
                $qrOnLeft ? 0 : $canvasWidth - $bandW,
                0,
                $bandW,
                $canvasHeight,
                $colors['primary'],
                0,
                1,
                true
            );
        }

        // White plate = quiet zone. Non-negotiable for scan reliability.
        $elements[] = $this->shape(
            $plateX,
            $plateY,
            $plateSize,
            $plateSize,
            '#ffffff',
            (int) round($plateSize * 0.08),
            1,
            true
        );

        $elements[] = $this->qr($plateX + $platePad, $plateY + $platePad, $qrSize, $scanLogoId);

        // Text column fills whatever is left.
        $textX = $qrOnLeft
            ? $plateX + $plateSize + $margin
            : $margin;
        $textW = $qrOnLeft
            ? $canvasWidth - $margin - $textX
            : $plateX - $margin - $textX;

        $textAlign = $qrOnLeft ? 'left' : 'right';

        $hasSub = $subtitle !== '';
        $hasCta = $ctaText !== '';

        $headlineH = (int) round($canvasHeight * ($hasSub ? 0.34 : 0.44));
        $headlineSize = $this->fitHeadline($headline, $textW, $headlineH);
        $subSize = (int) round($headlineSize * 0.42);
        $ctaH = $hasCta ? (int) round($canvasHeight * 0.17) : 0;

        $blockH = $headlineH + ($hasSub ? (int) round($subSize * 1.4) : 0) + ($hasCta ? $ctaH + (int) round($margin * 0.6) : 0);
        $cursorY = (int) round(($canvasHeight - $blockH) / 2);

        $elements[] = $this->text(
            $textX, $cursorY, $textW, $headlineH,
            $headline, $headlineSize, $font, '800', $colors['text'], $textAlign
        );
        $cursorY += $headlineH;

        if ($hasSub) {
            $subH = (int) round($subSize * 1.4);
            $elements[] = $this->text(
                $textX, $cursorY, $textW, $subH,
                $subtitle, $subSize, $font, '500', $colors['muted'], $textAlign
            );
            $cursorY += $subH;
        }

        if ($hasCta) {
            $ctaW = min($textW, (int) round($textW * 0.72));
            $ctaX = $qrOnLeft ? $textX : $textX + ($textW - $ctaW);
            $cursorY += (int) round($margin * 0.6);

            $elements[] = $this->shape($ctaX, $cursorY, $ctaW, $ctaH, $colors['accent'], (int) round($ctaH / 2), 1, false);
            $elements[] = $this->text(
                $ctaX, $cursorY, $ctaW, $ctaH,
                strtoupper($ctaText), (int) round($ctaH * 0.42), $font, '700', $colors['on_accent'], 'center'
            );
        }

        return [
            'elements' => $elements,
            'bgColor' => $colors['background'],
            'aspectRatio' => $aspectRatio,
            'warnings' => $warnings,
        ];
    }

    private function composeCentered(
        array $elements,
        array $colors,
        string $font,
        string $headline,
        string $subtitle,
        int $canvasWidth,
        int $canvasHeight,
        int $margin,
        int $dpi,
        ?int $scanLogoId,
        string $aspectRatio,
        array $warnings,
    ): array {
        $hasSub = $subtitle !== '';
        $headlineH = (int) round($canvasHeight * 0.16);
        $subH = $hasSub ? (int) round($canvasHeight * 0.10) : 0;
        $gap = (int) round($margin * 0.4);

        // Plate is sized to the space left over, then the QR is inset within it,
        // so the quiet zone can never spill past the trim line.
        $plateSize = min(
            $canvasHeight - ($margin * 2) - $headlineH - $subH - $gap,
            $canvasWidth - ($margin * 2)
        );
        $platePad = (int) round($plateSize * 0.055);
        $qrSize = $plateSize - ($platePad * 2);

        if ($qrSize < (int) round(self::MIN_QR_INCHES * $dpi)) {
            $warnings[] = 'QR is smaller than ' . self::MIN_QR_INCHES . '" and may not scan reliably.';
        }

        $headlineSize = $this->fitHeadline($headline, $canvasWidth - ($margin * 2), $headlineH);

        $elements[] = $this->text(
            $margin, $margin, $canvasWidth - ($margin * 2), $headlineH,
            $headline, $headlineSize, $font, '800', $colors['text'], 'center'
        );

        $plateX = (int) round(($canvasWidth - $plateSize) / 2);
        $plateY = $margin + $headlineH + $gap;

        $elements[] = $this->shape(
            $plateX, $plateY, $plateSize, $plateSize,
            '#ffffff', (int) round($plateSize * 0.08), 1, true
        );
        $elements[] = $this->qr($plateX + $platePad, $plateY + $platePad, $qrSize, $scanLogoId);

        if ($hasSub) {
            $elements[] = $this->text(
                $margin, $plateY + $plateSize, $canvasWidth - ($margin * 2), $subH,
                $subtitle, (int) round($subH * 0.55), $font, '500', $colors['muted'], 'center'
            );
        }

        return [
            'elements' => $elements,
            'bgColor' => $colors['background'],
            'aspectRatio' => $aspectRatio,
            'warnings' => $warnings,
        ];
    }

    /**
     * Rough single-line fit. Character width averages ~0.58em for bold sans,
     * which is close enough to keep the headline inside its box.
     */
    private function fitHeadline(string $text, int $boxWidth, int $boxHeight): int
    {
        $len = max(1, mb_strlen($text));
        $byWidth = (int) floor($boxWidth / ($len * 0.58));
        $byHeight = (int) floor($boxHeight * 0.82);

        return max(24, min($byWidth, $byHeight));
    }

    private function normalizeColors(array $colors): array
    {
        $hex = static function (?string $value, string $fallback): string {
            $value = is_string($value) ? trim($value) : '';

            return preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : $fallback;
        };

        $background = $hex($colors['background'] ?? null, '#ffffff');
        $primary = $hex($colors['primary'] ?? null, '#c8401a');
        $accent = $hex($colors['accent'] ?? null, $primary);
        $text = $hex($colors['text'] ?? null, $this->readableTextOn($background));

        return [
            'background' => $background,
            'primary' => $primary,
            'accent' => $accent,
            'text' => $text,
            'muted' => $this->withAlphaFallback($text),
            'on_accent' => $this->readableTextOn($accent),
        ];
    }

    /**
     * Print has no backlight; low-contrast text that looks fine on screen
     * disappears on vinyl. Pick black/white by luminance rather than trusting
     * whatever the model suggested.
     */
    private function readableTextOn(string $hexColor): string
    {
        [$r, $g, $b] = sscanf($hexColor, '#%02x%02x%02x');
        $luminance = (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;

        return $luminance > 0.6 ? '#111111' : '#ffffff';
    }

    private function withAlphaFallback(string $hexColor): string
    {
        return $hexColor === '#ffffff' ? '#e5e7eb' : '#4b5563';
    }

    private function shape(
        int $x, int $y, int $w, int $h,
        string $bgColor, int $radius, float $opacity, bool $locked
    ): array {
        return [
            'id' => $this->uid(),
            'type' => 'shape',
            'x' => $x, 'y' => $y, 'width' => $w, 'height' => $h,
            'rotation' => 0,
            'locked' => $locked,
            'bgColor' => $bgColor,
            'borderRadius' => $radius,
            'opacity' => $opacity,
        ];
    }

    private function text(
        int $x, int $y, int $w, int $h,
        string $content, int $fontSize, string $font, string $weight,
        string $color, string $align
    ): array {
        return [
            'id' => $this->uid(),
            'type' => 'text',
            'x' => $x, 'y' => $y, 'width' => $w, 'height' => $h,
            'rotation' => 0,
            'locked' => false,
            'content' => $content,
            'fontSize' => $fontSize,
            'fontFamily' => $font,
            'fontWeight' => $weight,
            'fontStyle' => 'normal',
            'textColor' => $color,
            'textAlign' => $align,
        ];
    }

    private function qr(int $x, int $y, int $size, ?int $scanLogoId): array
    {
        return [
            'id' => $this->uid(),
            'type' => 'qr',
            'x' => $x, 'y' => $y, 'width' => $size, 'height' => $size,
            'rotation' => 0,
            'locked' => false,
            'scanLogoId' => $scanLogoId,
            // The composer already draws the headline/CTA, so the editor must
            // render this as a plain scannable code, not a full ScanLogo banner.
            'plainQr' => true,
        ];
    }

    private function uid(): string
    {
        return 'el_' . Str::lower(Str::random(10));
    }
}
