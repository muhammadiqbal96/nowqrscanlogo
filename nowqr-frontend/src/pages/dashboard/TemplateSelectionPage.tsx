import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
    ArrowLeft, Loader2, Sparkles, Search, Plus, X,
    ChevronRight, FileText, Wand2,
} from 'lucide-react'
import { campaignApi, scanLogoApi, aiApi } from '@/lib/api'
import toast from 'react-hot-toast'

/* ═══════════════════════════════════════════════════════════════
   Static Template Presets — Canva-style designs
   Canvas = 1080 × 1920 (9:16)
   ═══════════════════════════════════════════════════════════════ */

interface TemplatePreset {
    id: string
    name: string
    category: string
    bg: string                  // CSS background (color, gradient, or fallback for image)
    bgImage?: string            // Optional background image URL
    font: string
    accentFont: string          // secondary font
    accent: string              // primary accent color
    textColor: string           // main text color
    subtextColor: string        // secondary text color
    layout: 'left' | 'center' | 'right'
    // Optional: decorative shapes (used as overlays, accents, frames)
    shapes?: { x: number; y: number; w: number; h: number; color: string; radius?: number; opacity?: number }[]
    // Feature bullet points
    features?: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string; dotColor?: string }
    // Element positions on 1080x1920 canvas
    elements: {
        businessName: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string }
        headline: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string }
        subHeadline: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string }
        description: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string }
        cta: { x: number; y: number; w: number; h: number; size: number; weight: string; color: string; bgColor?: string }
        qr: { x: number; y: number; w: number; h: number }
    }
}

const TEMPLATES: TemplatePreset[] = [
    /* 1 — Modern Clean (white, left-aligned, professional) */
    {
        id: 'modern-clean', name: 'Modern Clean', category: 'business',
        bg: '#ffffff', font: 'Inter', accentFont: 'Inter', accent: '#1e293b',
        textColor: '#0f172a', subtextColor: '#64748b', layout: 'left',
        shapes: [
            { x: 0, y: 0, w: 1080, h: 8, color: '#1e293b' },
            { x: 0, y: 1912, w: 1080, h: 8, color: '#1e293b' },
            { x: 540, y: 80, w: 480, h: 600, color: '#f1f5f9', radius: 24 },
            { x: 560, y: 100, w: 440, h: 560, color: '#e2e8f0', radius: 20 },
            { x: 60, y: 950, w: 960, h: 280, color: '#f8fafc', radius: 16 },
            { x: 80, y: 1280, w: 920, h: 2, color: '#e2e8f0' },
            { x: 80, y: 1460, w: 12, h: 12, color: '#1e293b', radius: 6 },
            { x: 108, y: 1460, w: 12, h: 12, color: '#94a3b8', radius: 6 },
            { x: 136, y: 1460, w: 12, h: 12, color: '#cbd5e1', radius: 6 },
        ],
        features: { x: 80, y: 970, w: 900, h: 240, size: 18, weight: '500', color: '#334155', dotColor: '#1e293b' },
        elements: {
            businessName: { x: 80, y: 140, w: 400, h: 50, size: 16, weight: '700', color: '#94a3b8' },
            headline: { x: 80, y: 260, w: 440, h: 260, size: 56, weight: '800', color: '#0f172a' },
            subHeadline: { x: 80, y: 560, w: 420, h: 100, size: 22, weight: '400', color: '#475569' },
            description: { x: 80, y: 700, w: 900, h: 160, size: 18, weight: '400', color: '#64748b' },
            cta: { x: 80, y: 1710, w: 400, h: 80, size: 22, weight: '700', color: '#ffffff', bgColor: '#1e293b' },
            qr: { x: 660, y: 1380, w: 320, h: 320 },
        },
    },
    /* 2 — Dark Luxury (dark bg, gold accents, centered) */
    {
        id: 'dark-luxury', name: 'Dark Luxury', category: 'fashion',
        bg: 'linear-gradient(175deg, #18181b 0%, #09090b 100%)', font: 'Playfair Display', accentFont: 'Inter',
        accent: '#d4a574', textColor: '#fafafa', subtextColor: '#a1a1aa', layout: 'center',
        shapes: [
            { x: 340, y: 60, w: 400, h: 2, color: '#d4a574' },
            { x: 80, y: 160, w: 60, h: 2, color: '#d4a574' },
            { x: 80, y: 160, w: 2, h: 60, color: '#d4a574' },
            { x: 940, y: 160, w: 60, h: 2, color: '#d4a574' },
            { x: 998, y: 160, w: 2, h: 60, color: '#d4a574' },
            { x: 80, y: 780, w: 60, h: 2, color: '#d4a574' },
            { x: 80, y: 722, w: 2, h: 60, color: '#d4a574' },
            { x: 940, y: 780, w: 60, h: 2, color: '#d4a574' },
            { x: 998, y: 722, w: 2, h: 60, color: '#d4a574' },
            { x: 490, y: 810, w: 100, h: 100, color: '#d4a574', radius: 4, opacity: 0.08 },
            { x: 80, y: 1000, w: 440, h: 180, color: '#d4a574', radius: 12, opacity: 0.06 },
            { x: 560, y: 1000, w: 440, h: 180, color: '#d4a574', radius: 12, opacity: 0.06 },
            { x: 340, y: 1860, w: 400, h: 2, color: '#d4a574' },
        ],
        features: { x: 100, y: 1020, w: 880, h: 140, size: 17, weight: '400', color: '#a1a1aa', dotColor: '#d4a574' },
        elements: {
            businessName: { x: 290, y: 80, w: 500, h: 50, size: 14, weight: '600', color: '#d4a574' },
            headline: { x: 120, y: 240, w: 840, h: 280, size: 66, weight: '700', color: '#fafafa' },
            subHeadline: { x: 140, y: 560, w: 800, h: 100, size: 24, weight: '400', color: '#d4a574' },
            description: { x: 120, y: 700, w: 840, h: 80, size: 17, weight: '400', color: '#a1a1aa' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 20, weight: '700', color: '#09090b', bgColor: '#d4a574' },
            qr: { x: 380, y: 1300, w: 320, h: 320 },
        },
    },
    /* 3 — Bold Statement (red bg, impact style) */
    {
        id: 'bold-statement', name: 'Bold Statement', category: 'promotion',
        bg: '#dc2626', font: 'Montserrat', accentFont: 'Inter', accent: '#ffffff',
        textColor: '#ffffff', subtextColor: 'rgba(255,255,255,0.85)', layout: 'left',
        shapes: [
            { x: 600, y: 0, w: 480, h: 1920, color: '#b91c1c', radius: 0 },
            { x: 80, y: 80, w: 120, h: 6, color: '#ffffff' },
            { x: 80, y: 100, w: 60, h: 6, color: '#ffffff', opacity: 0.5 },
            { x: 780, y: 200, w: 200, h: 200, color: 'rgba(255,255,255,0.08)', radius: 100 },
            { x: 820, y: 240, w: 120, h: 120, color: 'rgba(255,255,255,0.06)', radius: 60 },
            { x: 60, y: 920, w: 500, h: 240, color: 'rgba(0,0,0,0.15)', radius: 16 },
            { x: 0, y: 1870, w: 1080, h: 50, color: '#991b1b' },
        ],
        features: { x: 80, y: 940, w: 460, h: 200, size: 17, weight: '600', color: 'rgba(255,255,255,0.9)', dotColor: '#ffffff' },
        elements: {
            businessName: { x: 80, y: 200, w: 400, h: 50, size: 16, weight: '700', color: 'rgba(255,255,255,0.7)' },
            headline: { x: 80, y: 320, w: 480, h: 300, size: 64, weight: '900', color: '#ffffff' },
            subHeadline: { x: 80, y: 660, w: 480, h: 100, size: 24, weight: '500', color: 'rgba(255,255,255,0.85)' },
            description: { x: 80, y: 800, w: 500, h: 100, size: 18, weight: '400', color: 'rgba(255,255,255,0.7)' },
            cta: { x: 80, y: 1720, w: 400, h: 80, size: 22, weight: '800', color: '#dc2626', bgColor: '#ffffff' },
            qr: { x: 660, y: 1000, w: 320, h: 320 },
        },
    },
    /* 4 — Sunset Gradient (warm event style) */
    {
        id: 'sunset-gradient', name: 'Sunset Gradient', category: 'event',
        bg: 'linear-gradient(160deg, #f97316 0%, #ec4899 100%)', font: 'Montserrat', accentFont: 'Poppins',
        accent: '#ffffff', textColor: '#ffffff', subtextColor: 'rgba(255,255,255,0.85)', layout: 'center',
        shapes: [
            { x: 290, y: 40, w: 500, h: 500, color: 'rgba(255,255,255,0.07)', radius: 250 },
            { x: 340, y: 90, w: 400, h: 400, color: 'rgba(255,255,255,0.05)', radius: 200 },
            { x: -60, y: 800, w: 200, h: 500, color: 'rgba(255,255,255,0.04)', radius: 20 },
            { x: 940, y: 600, w: 200, h: 500, color: 'rgba(255,255,255,0.04)', radius: 20 },
            { x: 60, y: 920, w: 300, h: 180, color: 'rgba(255,255,255,0.12)', radius: 16 },
            { x: 390, y: 920, w: 300, h: 180, color: 'rgba(255,255,255,0.12)', radius: 16 },
            { x: 720, y: 920, w: 300, h: 180, color: 'rgba(255,255,255,0.12)', radius: 16 },
            { x: 240, y: 1600, w: 600, h: 200, color: 'rgba(255,255,255,0.06)', radius: 100 },
        ],
        features: { x: 80, y: 940, w: 920, h: 140, size: 16, weight: '600', color: 'rgba(255,255,255,0.9)', dotColor: '#ffffff' },
        elements: {
            businessName: { x: 290, y: 100, w: 500, h: 50, size: 16, weight: '700', color: 'rgba(255,255,255,0.7)' },
            headline: { x: 60, y: 300, w: 960, h: 280, size: 72, weight: '800', color: '#ffffff' },
            subHeadline: { x: 120, y: 620, w: 840, h: 100, size: 26, weight: '400', color: 'rgba(255,255,255,0.9)' },
            description: { x: 120, y: 760, w: 840, h: 120, size: 18, weight: '400', color: 'rgba(255,255,255,0.75)' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 22, weight: '800', color: '#f97316', bgColor: '#ffffff' },
            qr: { x: 380, y: 1240, w: 320, h: 320 },
        },
    },
    /* 5 — Minimalist Slate */
    {
        id: 'minimalist-slate', name: 'Minimalist', category: 'business',
        bg: '#f8fafc', font: 'Inter', accentFont: 'Inter', accent: '#334155',
        textColor: '#0f172a', subtextColor: '#94a3b8', layout: 'left',
        shapes: [
            { x: 80, y: 380, w: 60, h: 6, color: '#334155' },
            { x: 680, y: 80, w: 340, h: 340, color: '#e2e8f0', radius: 170 },
            { x: 720, y: 120, w: 260, h: 260, color: '#cbd5e1', radius: 130 },
            { x: 80, y: 960, w: 440, h: 160, color: '#f1f5f9', radius: 12 },
            { x: 560, y: 960, w: 440, h: 160, color: '#f1f5f9', radius: 12 },
            { x: 80, y: 1180, w: 920, h: 1, color: '#e2e8f0' },
            { x: 820, y: 1240, w: 180, h: 180, color: '#e2e8f0', radius: 16 },
            { x: 80, y: 1460, w: 12, h: 12, color: '#334155', radius: 6 },
            { x: 104, y: 1460, w: 12, h: 12, color: '#94a3b8', radius: 6 },
        ],
        features: { x: 96, y: 978, w: 880, h: 120, size: 16, weight: '500', color: '#475569', dotColor: '#334155' },
        elements: {
            businessName: { x: 80, y: 200, w: 400, h: 40, size: 14, weight: '700', color: '#94a3b8' },
            headline: { x: 80, y: 420, w: 560, h: 280, size: 64, weight: '900', color: '#0f172a' },
            subHeadline: { x: 80, y: 740, w: 560, h: 80, size: 22, weight: '400', color: '#475569' },
            description: { x: 80, y: 860, w: 700, h: 80, size: 17, weight: '400', color: '#94a3b8' },
            cta: { x: 80, y: 1720, w: 340, h: 70, size: 18, weight: '700', color: '#ffffff', bgColor: '#334155' },
            qr: { x: 80, y: 1280, w: 300, h: 300 },
        },
    },
    /* 6 — Ocean Breeze (blue gradient, split layout) */
    {
        id: 'ocean-breeze', name: 'Ocean Breeze', category: 'product',
        bg: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', font: 'Poppins', accentFont: 'Inter',
        accent: '#ffffff', textColor: '#ffffff', subtextColor: 'rgba(255,255,255,0.8)', layout: 'left',
        shapes: [
            { x: 60, y: 100, w: 480, h: 640, color: 'rgba(255,255,255,0.1)', radius: 24 },
            { x: 80, y: 120, w: 440, h: 600, color: 'rgba(255,255,255,0.08)', radius: 20 },
            { x: 160, y: 280, w: 280, h: 280, color: 'rgba(255,255,255,0.1)', radius: 140 },
            { x: 60, y: 1040, w: 300, h: 150, color: 'rgba(255,255,255,0.1)', radius: 16 },
            { x: 390, y: 1040, w: 300, h: 150, color: 'rgba(255,255,255,0.1)', radius: 16 },
            { x: 720, y: 1040, w: 300, h: 150, color: 'rgba(255,255,255,0.1)', radius: 16 },
            { x: -100, y: 1500, w: 1280, h: 300, color: 'rgba(255,255,255,0.04)', radius: 200 },
        ],
        features: { x: 80, y: 1060, w: 920, h: 110, size: 15, weight: '600', color: 'rgba(255,255,255,0.9)', dotColor: '#ffffff' },
        elements: {
            businessName: { x: 580, y: 120, w: 440, h: 50, size: 16, weight: '600', color: 'rgba(255,255,255,0.7)' },
            headline: { x: 580, y: 200, w: 440, h: 280, size: 48, weight: '700', color: '#ffffff' },
            subHeadline: { x: 580, y: 520, w: 440, h: 100, size: 20, weight: '400', color: 'rgba(255,255,255,0.85)' },
            description: { x: 580, y: 660, w: 440, h: 140, size: 16, weight: '400', color: 'rgba(255,255,255,0.7)' },
            cta: { x: 60, y: 1720, w: 500, h: 80, size: 20, weight: '700', color: '#6366f1', bgColor: '#ffffff' },
            qr: { x: 660, y: 1340, w: 300, h: 300 },
        },
    },
    /* 7 — Neon Night (dark with cyan accents) */
    {
        id: 'neon-night', name: 'Neon Night', category: 'event',
        bg: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)', font: 'Montserrat', accentFont: 'Inter',
        accent: '#22d3ee', textColor: '#f8fafc', subtextColor: '#94a3b8', layout: 'center',
        shapes: [
            { x: 200, y: 60, w: 680, h: 680, color: '#22d3ee', radius: 340, opacity: 0.04 },
            { x: 280, y: 140, w: 520, h: 520, color: '#22d3ee', radius: 260, opacity: 0.03 },
            { x: 0, y: 880, w: 1080, h: 2, color: '#22d3ee', opacity: 0.3 },
            { x: 0, y: 884, w: 1080, h: 1, color: '#22d3ee', opacity: 0.15 },
            { x: 60, y: 940, w: 300, h: 160, color: '#22d3ee', radius: 12, opacity: 0.06 },
            { x: 390, y: 940, w: 300, h: 160, color: '#22d3ee', radius: 12, opacity: 0.06 },
            { x: 720, y: 940, w: 300, h: 160, color: '#22d3ee', radius: 12, opacity: 0.06 },
            { x: -100, y: 1400, w: 300, h: 300, color: '#22d3ee', radius: 150, opacity: 0.03 },
            { x: 880, y: 1500, w: 300, h: 300, color: '#22d3ee', radius: 150, opacity: 0.03 },
        ],
        features: { x: 80, y: 960, w: 920, h: 120, size: 15, weight: '600', color: '#22d3ee', dotColor: '#22d3ee' },
        elements: {
            businessName: { x: 290, y: 100, w: 500, h: 50, size: 16, weight: '700', color: '#22d3ee' },
            headline: { x: 60, y: 280, w: 960, h: 300, size: 74, weight: '900', color: '#f8fafc' },
            subHeadline: { x: 120, y: 620, w: 840, h: 80, size: 24, weight: '400', color: '#22d3ee' },
            description: { x: 140, y: 740, w: 800, h: 100, size: 18, weight: '400', color: '#94a3b8' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 22, weight: '800', color: '#020617', bgColor: '#22d3ee' },
            qr: { x: 380, y: 1260, w: 320, h: 320 },
        },
    },
    /* 8 — Warm Earth (beige tones, elegant, fashion) */
    {
        id: 'warm-earth', name: 'Warm Earth', category: 'fashion',
        bg: 'linear-gradient(170deg, #fef3c7 0%, #d6d3d1 100%)', font: 'Playfair Display', accentFont: 'Lato',
        accent: '#92400e', textColor: '#451a03', subtextColor: '#78350f', layout: 'center',
        shapes: [
            { x: 60, y: 60, w: 460, h: 600, color: '#92400e', radius: 16, opacity: 0.08 },
            { x: 560, y: 60, w: 460, h: 600, color: '#92400e', radius: 16, opacity: 0.1 },
            { x: 80, y: 80, w: 420, h: 560, color: '#92400e', radius: 12, opacity: 0.05 },
            { x: 580, y: 80, w: 420, h: 560, color: '#92400e', radius: 12, opacity: 0.05 },
            { x: 390, y: 700, w: 300, h: 2, color: '#92400e', opacity: 0.4 },
            { x: 510, y: 690, w: 60, h: 24, color: '#92400e', radius: 12, opacity: 0.1 },
            { x: 80, y: 1100, w: 920, h: 200, color: '#92400e', radius: 16, opacity: 0.04 },
        ],
        features: { x: 100, y: 1120, w: 880, h: 160, size: 17, weight: '400', color: '#78350f', dotColor: '#92400e' },
        elements: {
            businessName: { x: 290, y: 740, w: 500, h: 50, size: 14, weight: '600', color: '#b45309' },
            headline: { x: 80, y: 820, w: 920, h: 180, size: 56, weight: '700', color: '#451a03' },
            subHeadline: { x: 140, y: 1020, w: 800, h: 60, size: 20, weight: '400', color: '#78350f' },
            description: { x: 160, y: 1340, w: 760, h: 100, size: 17, weight: '400', color: '#92400e' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 20, weight: '700', color: '#ffffff', bgColor: '#92400e' },
            qr: { x: 380, y: 1480, w: 320, h: 180 },
        },
    },
    /* 9 — Mint Fresh (fresh greens, product focus) */
    {
        id: 'mint-fresh', name: 'Mint Fresh', category: 'product',
        bg: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)', font: 'Lato', accentFont: 'Lato',
        accent: '#059669', textColor: '#064e3b', subtextColor: '#047857', layout: 'left',
        shapes: [
            { x: 80, y: 250, w: 40, h: 4, color: '#059669' },
            { x: 580, y: 100, w: 440, h: 560, color: '#059669', radius: 24, opacity: 0.06 },
            { x: 600, y: 120, w: 400, h: 520, color: '#059669', radius: 20, opacity: 0.08 },
            { x: 700, y: 260, w: 200, h: 200, color: '#059669', radius: 100, opacity: 0.12 },
            { x: 60, y: 900, w: 960, h: 260, color: '#059669', radius: 16, opacity: 0.04 },
            { x: 80, y: 1220, w: 8, h: 8, color: '#059669', radius: 4 },
            { x: 100, y: 1220, w: 8, h: 8, color: '#059669', radius: 4, opacity: 0.5 },
            { x: 120, y: 1220, w: 8, h: 8, color: '#059669', radius: 4, opacity: 0.3 },
        ],
        features: { x: 80, y: 920, w: 920, h: 220, size: 17, weight: '500', color: '#064e3b', dotColor: '#059669' },
        elements: {
            businessName: { x: 80, y: 120, w: 460, h: 50, size: 16, weight: '700', color: '#059669' },
            headline: { x: 80, y: 280, w: 460, h: 260, size: 52, weight: '800', color: '#064e3b' },
            subHeadline: { x: 80, y: 580, w: 460, h: 80, size: 22, weight: '400', color: '#047857' },
            description: { x: 80, y: 700, w: 460, h: 140, size: 17, weight: '400', color: '#6b7280' },
            cta: { x: 80, y: 1720, w: 340, h: 70, size: 18, weight: '700', color: '#ffffff', bgColor: '#059669' },
            qr: { x: 80, y: 1320, w: 300, h: 300 },
        },
    },
    /* 10 — Royal Purple (rich gradients, event/premium) */
    {
        id: 'royal-purple', name: 'Royal Purple', category: 'event',
        bg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1e1b4b 100%)', font: 'Inter', accentFont: 'Inter',
        accent: '#c4b5fd', textColor: '#ffffff', subtextColor: '#ddd6fe', layout: 'center',
        shapes: [
            { x: 190, y: -100, w: 700, h: 700, color: 'rgba(196,181,253,0.06)', radius: 350 },
            { x: 390, y: 380, w: 300, h: 3, color: '#c4b5fd', opacity: 0.4 },
            { x: 60, y: 940, w: 300, h: 180, color: 'rgba(196,181,253,0.08)', radius: 16 },
            { x: 390, y: 940, w: 300, h: 180, color: 'rgba(196,181,253,0.08)', radius: 16 },
            { x: 720, y: 940, w: 300, h: 180, color: 'rgba(196,181,253,0.08)', radius: 16 },
            { x: -80, y: 1400, w: 300, h: 300, color: 'rgba(196,181,253,0.06)', radius: 150 },
            { x: 860, y: 1500, w: 300, h: 300, color: 'rgba(196,181,253,0.06)', radius: 150 },
        ],
        features: { x: 80, y: 960, w: 920, h: 140, size: 16, weight: '600', color: '#ddd6fe', dotColor: '#c4b5fd' },
        elements: {
            businessName: { x: 290, y: 120, w: 500, h: 50, size: 16, weight: '600', color: '#c4b5fd' },
            headline: { x: 80, y: 420, w: 920, h: 260, size: 68, weight: '800', color: '#ffffff' },
            subHeadline: { x: 140, y: 720, w: 800, h: 80, size: 24, weight: '400', color: '#ddd6fe' },
            description: { x: 140, y: 840, w: 800, h: 80, size: 18, weight: '400', color: '#a5b4fc' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 22, weight: '700', color: '#1e1b4b', bgColor: '#c4b5fd' },
            qr: { x: 380, y: 1280, w: 320, h: 320 },
        },
    },
    /* 11 — Coffee House (dark with warm gold) */
    {
        id: 'coffee-house', name: 'Coffee House', category: 'food',
        bg: '#1c1917', font: 'Playfair Display', accentFont: 'Lato', accent: '#fbbf24',
        textColor: '#fef3c7', subtextColor: '#d6d3d1', layout: 'center',
        shapes: [
            { x: 240, y: -60, w: 600, h: 400, color: '#fbbf24', radius: 300, opacity: 0.06 },
            { x: 80, y: 120, w: 920, h: 2, color: '#fbbf24', opacity: 0.2 },
            { x: 140, y: 160, w: 800, h: 360, color: '#fbbf24', radius: 16, opacity: 0.04 },
            { x: 480, y: 560, w: 120, h: 3, color: '#fbbf24', opacity: 0.5 },
            { x: 60, y: 960, w: 300, h: 160, color: '#fbbf24', radius: 12, opacity: 0.05 },
            { x: 390, y: 960, w: 300, h: 160, color: '#fbbf24', radius: 12, opacity: 0.05 },
            { x: 720, y: 960, w: 300, h: 160, color: '#fbbf24', radius: 12, opacity: 0.05 },
            { x: 200, y: 1700, w: 680, h: 200, color: '#fbbf24', radius: 100, opacity: 0.04 },
        ],
        features: { x: 80, y: 980, w: 920, h: 120, size: 16, weight: '500', color: '#d6d3d1', dotColor: '#fbbf24' },
        elements: {
            businessName: { x: 290, y: 580, w: 500, h: 50, size: 16, weight: '600', color: '#fbbf24' },
            headline: { x: 80, y: 660, w: 920, h: 180, size: 58, weight: '700', color: '#fef3c7' },
            subHeadline: { x: 140, y: 860, w: 800, h: 60, size: 22, weight: '400', color: '#d6d3d1' },
            description: { x: 160, y: 1160, w: 760, h: 100, size: 17, weight: '400', color: '#a8a29e' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 22, weight: '700', color: '#1c1917', bgColor: '#fbbf24' },
            qr: { x: 380, y: 1380, w: 320, h: 260 },
        },
    },
    /* 12 — Coral Pop (warm gradient, promotion) */
    {
        id: 'coral-pop', name: 'Coral Pop', category: 'promotion',
        bg: 'linear-gradient(145deg, #fb7185 0%, #f97316 100%)', font: 'Poppins', accentFont: 'Poppins',
        accent: '#ffffff', textColor: '#ffffff', subtextColor: 'rgba(255,255,255,0.85)', layout: 'left',
        shapes: [
            { x: 560, y: 60, w: 460, h: 580, color: 'rgba(255,255,255,0.12)', radius: 24 },
            { x: 580, y: 80, w: 420, h: 540, color: 'rgba(255,255,255,0.08)', radius: 20 },
            { x: 680, y: 200, w: 220, h: 220, color: 'rgba(255,255,255,0.12)', radius: 110 },
            { x: 60, y: 960, w: 960, h: 180, color: 'rgba(255,255,255,0.1)', radius: 16 },
            { x: 80, y: 700, w: 500, h: 2, color: 'rgba(255,255,255,0.3)' },
            { x: -80, y: 1500, w: 300, h: 300, color: 'rgba(255,255,255,0.05)', radius: 150 },
        ],
        features: { x: 80, y: 980, w: 920, h: 140, size: 16, weight: '600', color: 'rgba(255,255,255,0.9)', dotColor: '#ffffff' },
        elements: {
            businessName: { x: 80, y: 100, w: 440, h: 50, size: 16, weight: '700', color: 'rgba(255,255,255,0.7)' },
            headline: { x: 80, y: 200, w: 440, h: 280, size: 56, weight: '800', color: '#ffffff' },
            subHeadline: { x: 80, y: 520, w: 440, h: 80, size: 22, weight: '400', color: 'rgba(255,255,255,0.85)' },
            description: { x: 80, y: 740, w: 920, h: 160, size: 18, weight: '400', color: 'rgba(255,255,255,0.75)' },
            cta: { x: 80, y: 1720, w: 400, h: 80, size: 20, weight: '700', color: '#f97316', bgColor: '#ffffff' },
            qr: { x: 680, y: 1340, w: 300, h: 300 },
        },
    },
    /* 13 — Forest Deep (rich green gradient, product) */
    {
        id: 'forest-deep', name: 'Forest Deep', category: 'product',
        bg: 'linear-gradient(170deg, #064e3b 0%, #14532d 100%)', font: 'Lato', accentFont: 'Lato',
        accent: '#86efac', textColor: '#ffffff', subtextColor: '#bbf7d0', layout: 'left',
        shapes: [
            { x: 60, y: 140, w: 480, h: 640, color: 'rgba(134,239,172,0.07)', radius: 24 },
            { x: 80, y: 160, w: 440, h: 600, color: 'rgba(134,239,172,0.05)', radius: 20 },
            { x: 180, y: 320, w: 240, h: 240, color: 'rgba(134,239,172,0.1)', radius: 120 },
            { x: 60, y: 1000, w: 300, h: 150, color: 'rgba(134,239,172,0.06)', radius: 12 },
            { x: 390, y: 1000, w: 300, h: 150, color: 'rgba(134,239,172,0.06)', radius: 12 },
            { x: 720, y: 1000, w: 300, h: 150, color: 'rgba(134,239,172,0.06)', radius: 12 },
            { x: 580, y: 880, w: 440, h: 2, color: '#86efac', opacity: 0.2 },
        ],
        features: { x: 80, y: 1020, w: 920, h: 110, size: 15, weight: '500', color: '#bbf7d0', dotColor: '#86efac' },
        elements: {
            businessName: { x: 580, y: 180, w: 440, h: 50, size: 16, weight: '700', color: '#86efac' },
            headline: { x: 580, y: 280, w: 440, h: 260, size: 48, weight: '800', color: '#ffffff' },
            subHeadline: { x: 580, y: 580, w: 440, h: 80, size: 20, weight: '400', color: '#bbf7d0' },
            description: { x: 580, y: 700, w: 440, h: 140, size: 16, weight: '400', color: 'rgba(255,255,255,0.65)' },
            cta: { x: 60, y: 1720, w: 400, h: 80, size: 20, weight: '700', color: '#064e3b', bgColor: '#86efac' },
            qr: { x: 660, y: 1300, w: 300, h: 300 },
        },
    },
    /* 14 — Soft Pastel (beauty, cosmetics) */
    {
        id: 'soft-pastel', name: 'Soft Pastel', category: 'beauty',
        bg: 'linear-gradient(135deg, #e9d5ff 0%, #fce7f3 50%, #fef9c3 100%)', font: 'Poppins', accentFont: 'Poppins',
        accent: '#7c3aed', textColor: '#1e1b4b', subtextColor: '#6b21a8', layout: 'center',
        shapes: [
            { x: 80, y: 40, w: 920, h: 420, color: '#7c3aed', radius: 24, opacity: 0.05 },
            { x: 120, y: 80, w: 840, h: 340, color: '#7c3aed', radius: 20, opacity: 0.04 },
            { x: 290, y: 120, w: 500, h: 260, color: '#7c3aed', radius: 130, opacity: 0.06 },
            { x: 390, y: 500, w: 300, h: 3, color: '#7c3aed', opacity: 0.25 },
            { x: 80, y: 1020, w: 920, h: 220, color: '#7c3aed', radius: 16, opacity: 0.04 },
            { x: 780, y: 1300, w: 240, h: 240, color: '#7c3aed', radius: 120, opacity: 0.05 },
        ],
        features: { x: 100, y: 1040, w: 880, h: 180, size: 17, weight: '500', color: '#6b21a8', dotColor: '#7c3aed' },
        elements: {
            businessName: { x: 290, y: 530, w: 500, h: 50, size: 16, weight: '600', color: '#7c3aed' },
            headline: { x: 80, y: 620, w: 920, h: 200, size: 58, weight: '800', color: '#1e1b4b' },
            subHeadline: { x: 140, y: 860, w: 800, h: 60, size: 22, weight: '400', color: '#6b21a8' },
            description: { x: 160, y: 940, w: 760, h: 60, size: 17, weight: '400', color: '#6b7280' },
            cta: { x: 290, y: 1720, w: 500, h: 80, size: 22, weight: '700', color: '#ffffff', bgColor: '#7c3aed' },
            qr: { x: 380, y: 1380, w: 320, h: 260 },
        },
    },
    /* 15 — Tech Blue (futuristic, business) */
    {
        id: 'tech-blue', name: 'Tech Blue', category: 'business',
        bg: 'linear-gradient(160deg, #1e3a5f 0%, #0d9488 100%)', font: 'Roboto', accentFont: 'Roboto',
        accent: '#2dd4bf', textColor: '#ffffff', subtextColor: '#99f6e4', layout: 'left',
        shapes: [
            { x: 580, y: 60, w: 440, h: 520, color: 'rgba(45,212,191,0.1)', radius: 20 },
            { x: 600, y: 80, w: 400, h: 480, color: 'rgba(45,212,191,0.08)', radius: 16 },
            { x: 700, y: 200, w: 200, h: 200, color: 'rgba(45,212,191,0.12)', radius: 100 },
            { x: 60, y: 860, w: 960, h: 2, color: '#2dd4bf', opacity: 0.25 },
            { x: 60, y: 864, w: 960, h: 1, color: '#2dd4bf', opacity: 0.12 },
            { x: 60, y: 920, w: 300, h: 160, color: 'rgba(45,212,191,0.06)', radius: 12 },
            { x: 390, y: 920, w: 300, h: 160, color: 'rgba(45,212,191,0.06)', radius: 12 },
            { x: 720, y: 920, w: 300, h: 160, color: 'rgba(45,212,191,0.06)', radius: 12 },
        ],
        features: { x: 80, y: 940, w: 920, h: 120, size: 15, weight: '600', color: '#99f6e4', dotColor: '#2dd4bf' },
        elements: {
            businessName: { x: 80, y: 100, w: 460, h: 50, size: 16, weight: '700', color: '#2dd4bf' },
            headline: { x: 80, y: 200, w: 460, h: 260, size: 52, weight: '700', color: '#ffffff' },
            subHeadline: { x: 80, y: 500, w: 460, h: 80, size: 22, weight: '400', color: '#99f6e4' },
            description: { x: 80, y: 620, w: 460, h: 160, size: 17, weight: '400', color: 'rgba(255,255,255,0.65)' },
            cta: { x: 80, y: 1720, w: 400, h: 80, size: 20, weight: '700', color: '#1e3a5f', bgColor: '#2dd4bf' },
            qr: { x: 380, y: 1280, w: 320, h: 320 },
        },
    },
]

const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'business', name: 'Business' },
    { id: 'promotion', name: 'Promotion' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'event', name: 'Event' },
    { id: 'product', name: 'Product' },
    { id: 'food', name: 'Food & Drink' },
    { id: 'beauty', name: 'Beauty' },
]

/* ═══════════════════════════════════════════════════════════════
   Mini poster preview — renders a scaled-down template
   ═══════════════════════════════════════════════════════════════ */
function TemplateMiniPreview({ preset }: { preset: TemplatePreset }) {
    const W = 1080, H = 1920
    const p = (v: number, max: number) => `${(v / max) * 100}%`

    return (
        <div className="aspect-[9/16] relative overflow-hidden rounded-t-xl"
            style={{ background: preset.bgImage ? `url(${preset.bgImage}) center/cover` : preset.bg, fontFamily: `'${preset.font}', sans-serif` }}>
            {/* Decorative shapes */}
            {preset.shapes?.map((s, i) => (
                <div key={`s${i}`} className="absolute" style={{
                    left: p(s.x, W), top: p(s.y, H), width: p(s.w, W), height: p(s.h, H),
                    backgroundColor: s.color, borderRadius: s.radius || 0, opacity: s.opacity ?? 1,
                }} />
            ))}

            {/* Business name */}
            <div className="absolute" style={{
                left: p(preset.elements.businessName.x, W), top: p(preset.elements.businessName.y, H),
                width: p(preset.elements.businessName.w, W),
            }}>
                <div className="text-[6px] font-bold uppercase tracking-[0.15em] truncate"
                    style={{ color: preset.elements.businessName.color, textAlign: preset.layout }}>
                    Your Business
                </div>
            </div>
            {/* Headline */}
            <div className="absolute" style={{
                left: p(preset.elements.headline.x, W), top: p(preset.elements.headline.y, H),
                width: p(preset.elements.headline.w, W), height: p(preset.elements.headline.h, H),
            }}>
                <div className="font-bold leading-[1.1] line-clamp-3"
                    style={{ fontSize: '11px', color: preset.elements.headline.color, textAlign: preset.layout,
                        fontWeight: preset.elements.headline.weight, fontFamily: `'${preset.font}', sans-serif` }}>
                    Your Headline Goes Here
                </div>
            </div>
            {/* Sub-headline */}
            <div className="absolute" style={{
                left: p(preset.elements.subHeadline.x, W), top: p(preset.elements.subHeadline.y, H),
                width: p(preset.elements.subHeadline.w, W),
            }}>
                <div className="line-clamp-2"
                    style={{ fontSize: '5px', color: preset.elements.subHeadline.color, textAlign: preset.layout }}>
                    Supporting subtitle text here
                </div>
            </div>
            {/* Description */}
            <div className="absolute" style={{
                left: p(preset.elements.description.x, W), top: p(preset.elements.description.y, H),
                width: p(preset.elements.description.w, W),
            }}>
                <div className="line-clamp-2"
                    style={{ fontSize: '4px', color: preset.elements.description.color, textAlign: preset.layout }}>
                    Brief description of your offering goes here for the reader
                </div>
            </div>
            {/* Feature bullets preview */}
            {preset.features && (
                <div className="absolute flex flex-col gap-[1px]" style={{
                    left: p(preset.features.x, W), top: p(preset.features.y, H),
                    width: p(preset.features.w, W), height: p(preset.features.h, H),
                }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex items-center gap-[2px]">
                            <div className="rounded-full flex-shrink-0" style={{
                                width: 2, height: 2,
                                backgroundColor: preset.features!.dotColor,
                            }} />
                            <div className="rounded-full" style={{
                                width: `${60 - i * 12}%`, height: 2,
                                backgroundColor: preset.features!.color, opacity: 0.4,
                            }} />
                        </div>
                    ))}
                </div>
            )}
            {/* CTA button */}
            <div className="absolute flex" style={{
                left: p(preset.elements.cta.x, W), top: p(preset.elements.cta.y, H),
                width: p(preset.elements.cta.w, W), height: p(preset.elements.cta.h, H),
                justifyContent: preset.layout === 'center' ? 'center' : preset.layout === 'right' ? 'flex-end' : 'flex-start',
            }}>
                <div className="px-3 py-0.5 rounded-sm font-bold uppercase tracking-wider"
                    style={{ fontSize: '4.5px', color: preset.elements.cta.color,
                        backgroundColor: preset.elements.cta.bgColor || 'transparent',
                        borderRadius: 4 }}>
                    Shop Now
                </div>
            </div>
            {/* QR placeholder */}
            <div className="absolute border flex items-center justify-center" style={{
                left: p(preset.elements.qr.x, W), top: p(preset.elements.qr.y, H),
                width: p(preset.elements.qr.w, W), height: p(preset.elements.qr.h, H),
                borderColor: preset.accent, borderWidth: 1, borderRadius: 4, opacity: 0.6,
            }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: preset.accent }}>
                    <rect width="5" height="5" x="3" y="3" /><rect width="5" height="5" x="16" y="3" />
                    <rect width="5" height="5" x="3" y="16" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
                </svg>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   Build canvas elements from a template preset + AI content
   ═══════════════════════════════════════════════════════════════ */
function buildCanvasElements(
    preset: TemplatePreset,
    content: { headline: string; sub_headline: string; description: string; cta_button_text: string },
    businessName: string,
) {
    let elId = 0
    const uid = () => `el_${++elId}_${Date.now()}`
    const align = preset.layout

    const elements: any[] = []

    // Decorative shapes first (background)
    preset.shapes?.forEach(s => {
        elements.push({
            id: uid(), type: 'shape', x: s.x, y: s.y, width: s.w, height: s.h,
            rotation: 0, locked: true, bgColor: s.color, borderRadius: s.radius || 0,
            opacity: s.opacity ?? 1,
        })
    })



    // Business name
    const bn = preset.elements.businessName
    elements.push({
        id: uid(), type: 'text', x: bn.x, y: bn.y, width: bn.w, height: bn.h,
        rotation: 0, locked: false,
        content: businessName || 'Your Business',
        fontSize: bn.size, fontFamily: preset.accentFont, fontWeight: bn.weight,
        textColor: bn.color, textAlign: align, fontStyle: 'normal',
    })

    // Headline
    const hl = preset.elements.headline
    elements.push({
        id: uid(), type: 'text', x: hl.x, y: hl.y, width: hl.w, height: hl.h,
        rotation: 0, locked: false,
        content: content.headline || 'Your Headline Here',
        fontSize: hl.size, fontFamily: preset.font, fontWeight: hl.weight,
        textColor: hl.color, textAlign: align, fontStyle: 'normal',
    })

    // Sub-headline
    const sh = preset.elements.subHeadline
    elements.push({
        id: uid(), type: 'text', x: sh.x, y: sh.y, width: sh.w, height: sh.h,
        rotation: 0, locked: false,
        content: content.sub_headline || '',
        fontSize: sh.size, fontFamily: preset.accentFont, fontWeight: sh.weight,
        textColor: sh.color, textAlign: align, fontStyle: 'normal',
    })

    // Description
    const desc = preset.elements.description
    elements.push({
        id: uid(), type: 'text', x: desc.x, y: desc.y, width: desc.w, height: desc.h,
        rotation: 0, locked: false,
        content: content.description || '',
        fontSize: desc.size, fontFamily: preset.accentFont, fontWeight: desc.weight,
        textColor: desc.color, textAlign: align, fontStyle: 'normal',
    })

    // Features / bullet points (from AI description, split into lines)
    if (preset.features) {
        const f = preset.features
        const bullets = (content.description || '').split(/[.!]\s+/).filter(s => s.trim().length > 3).slice(0, 4)
        if (bullets.length > 1) {
            const lineH = Math.floor(f.h / Math.min(bullets.length, 4))
            bullets.forEach((line, i) => {
                elements.push({
                    id: uid(), type: 'text', x: f.x, y: f.y + i * lineH, width: f.w, height: lineH,
                    rotation: 0, locked: false,
                    content: `• ${line.trim()}`,
                    fontSize: f.size, fontFamily: preset.accentFont, fontWeight: f.weight,
                    textColor: f.color, textAlign: align, fontStyle: 'normal',
                })
            })
        }
    }

    // QR code
    const qr = preset.elements.qr
    elements.push({
        id: uid(), type: 'qr', x: qr.x, y: qr.y, width: qr.w, height: qr.h,
        rotation: 0, locked: false,
    })

    // CTA button (shape bg + text)
    const cta = preset.elements.cta
    if (cta.bgColor) {
        elements.push({
            id: uid(), type: 'shape', x: cta.x, y: cta.y, width: cta.w, height: cta.h,
            rotation: 0, locked: false, bgColor: cta.bgColor, borderRadius: 12, opacity: 1,
        })
    }
    elements.push({
        id: uid(), type: 'text', x: cta.x, y: cta.y, width: cta.w, height: cta.h,
        rotation: 0, locked: false,
        content: content.cta_button_text || 'Act Now',
        fontSize: cta.size, fontFamily: preset.font, fontWeight: cta.weight,
        textColor: cta.color, textAlign: 'center', fontStyle: 'normal',
    })

    // Powered by NowQR
    elements.push({
        id: uid(), type: 'text', x: 340, y: 1840, width: 400, height: 40,
        rotation: 0, locked: false,
        content: 'Powered by NowQR',
        fontSize: 13, fontFamily: preset.accentFont, fontWeight: '400',
        textColor: preset.subtextColor, textAlign: 'center', fontStyle: 'normal',
    })

    return elements
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export default function TemplateSelectionPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isFlyer = searchParams.get('type') === 'flyer'

    // Phase: 'describe' (flyer only) or 'templates'
    const [phase, setPhase] = useState<'describe' | 'templates'>(isFlyer ? 'describe' : 'templates')

    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [campaign, setCampaign] = useState<any>(null)
    const [scanLogos, setScanLogos] = useState<any[]>([])

    // Describe form (for flyer flow)
    const [flyerDescription, setFlyerDescription] = useState('')
    const [flyerTone, setFlyerTone] = useState('professional')

    // AI-generated content (from campaign or from flyer describe step)
    const [aiContent, setAiContent] = useState<{
        headline: string; sub_headline: string; description: string; cta_button_text: string
    } | null>(null)

    // Template browsing
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    /* ─── Load campaign ─── */
    useEffect(() => {
        if (!id) return
        ;(async () => {
            try {
                const [campRes, logosRes] = await Promise.all([
                    campaignApi.get(Number(id)),
                    scanLogoApi.list(),
                ])
                const camp = campRes.data.campaign
                setCampaign(camp)
                setScanLogos(logosRes.data.data || [])

                // For campaign flow (not flyer), pre-fill AI content from campaign
                if (!isFlyer && camp.headline) {
                    setAiContent({
                        headline: camp.headline,
                        sub_headline: camp.sub_headline || '',
                        description: camp.description || '',
                        cta_button_text: camp.cta_button_text || '',
                    })
                }
            } catch {
                toast.error('Failed to load campaign')
                navigate('/dashboard/campaigns')
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    /* ─── Generate AI content for flyer from description ─── */
    const handleGenerateFlyer = async () => {
        if (!campaign || !flyerDescription.trim()) {
            toast.error('Please describe your flyer')
            return
        }
        setApplying(true)
        try {
            const res = await aiApi.generateContent({
                campaign_id: campaign.id,
                business_name: campaign.business_name,
                business_description: flyerDescription,
                target_audience: campaign.target_audience || '',
                cta_type: campaign.cta_type || 'buy',
                tone: flyerTone,
            })
            setAiContent(res.data.content)
            setPhase('templates')
            toast.success('Content generated! Now pick a template.')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate content')
        } finally {
            setApplying(false)
        }
    }

    /* ─── Filter templates ─── */
    const filtered = TEMPLATES.filter((t) => {
        const matchCat = activeCategory === 'all' || t.category === activeCategory
        const matchSearch = !searchQuery ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCat && matchSearch
    })

    /* ─── Apply template → build canvas elements → open editor ─── */
    const handleSelectTemplate = async (preset: TemplatePreset) => {
        if (!campaign) return

        // If no AI content yet (campaign flow with no content), generate first
        const content = aiContent || {
            headline: campaign.headline || 'Your Headline Here',
            sub_headline: campaign.sub_headline || 'Your subtitle here',
            description: campaign.description || 'Add a description for your offering.',
            cta_button_text: campaign.cta_button_text || 'Shop Now',
        }

        setApplying(true)
        try {
            const canvasElements = buildCanvasElements(preset, content, campaign.business_name || '')
            const qrMap: Record<string, number> = {}
            const firstScanLogo = scanLogos[0]
            if (firstScanLogo) {
                const qrEl = canvasElements.find((e: any) => e.type === 'qr')
                if (qrEl) qrMap[qrEl.id] = firstScanLogo.id
            }

            const canvasState = {
                elements: canvasElements,
                bgColor: preset.bg,
                bgImage: preset.bgImage || null,
                bgTemplate: null,
                aspectRatio: '9:16' as const,
                qrScanLogoMap: qrMap,
            }

            if (isFlyer) {
                // Store canvas state in sessionStorage for the editor to pick up
                sessionStorage.setItem(`flyer_canvas_${campaign.id}`, JSON.stringify(canvasState))
                toast.success('Template applied! Opening editor...')
                navigate(`/dashboard/campaigns/${campaign.id}/flyer?type=flyer`)
            } else {
                // Campaign post flow — save to campaign's page_design
                await campaignApi.update(campaign.id, {
                    headline: content.headline,
                    sub_headline: content.sub_headline,
                    description: content.description,
                    cta_button_text: content.cta_button_text,
                    primary_color: preset.accent,
                    font_family: preset.font,
                    page_design: canvasState,
                })

                if (campaign.status !== 'active') {
                    try { await campaignApi.publish(campaign.id) } catch { /* ok */ }
                }

                toast.success('Template applied! Opening editor...')
                navigate(`/dashboard/campaigns/${campaign.id}/flyer`)
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to apply template')
        } finally {
            setApplying(false)
        }
    }

    const handleCreateBlank = () => {
        if (isFlyer) {
            sessionStorage.removeItem(`flyer_canvas_${campaign?.id}`)
        }
        navigate(`/dashboard/campaigns/${id}/flyer${isFlyer ? '?type=flyer' : ''}`)
    }

    /* ─── Loading / not-found ─── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }
    if (!campaign) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Campaign not found.</p>
                <Link to="/dashboard/campaigns" className="text-primary text-sm mt-2 inline-block">Back to campaigns</Link>
            </div>
        )
    }

    /* ═══════════════════════════════════════════════════════════
       PHASE 1: Describe your flyer (flyer flow only)
       ═══════════════════════════════════════════════════════════ */
    if (phase === 'describe') {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <button onClick={() => navigate(`/dashboard/campaigns/${campaign.id}`)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to campaign
                </button>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                        <FileText className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Create a Flyer</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Describe what your flyer is about and we'll generate the content with AI.
                        Then you'll pick a template design.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                    {/* Campaign context */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <Sparkles className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{campaign.business_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{campaign.name}</p>
                        </div>
                    </div>

                    {/* Flyer description */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">What is this flyer about?</label>
                        <textarea
                            value={flyerDescription}
                            onChange={(e) => setFlyerDescription(e.target.value)}
                            placeholder="e.g., Summer sale — 50% off all items this weekend only. Highlight our new collection and drive foot traffic to our downtown store."
                            rows={4}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Be specific — mention offers, dates, products, or events.</p>
                    </div>

                    {/* Tone */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Tone</label>
                        <div className="flex flex-wrap gap-2">
                            {['professional', 'friendly', 'urgent', 'luxury', 'casual', 'bold'].map(tone => (
                                <button key={tone} onClick={() => setFlyerTone(tone)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${flyerTone === tone
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}>
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={handleGenerateFlyer} disabled={applying || !flyerDescription.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all">
                            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {applying ? 'Generating...' : 'Generate & Pick Template'}
                        </button>
                        <button onClick={() => { setPhase('templates') }}
                            className="flex items-center gap-1 px-4 py-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors">
                            Skip <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center">Uses 5 credits to generate AI content</p>
                </div>
            </div>
        )
    }

    /* ═══════════════════════════════════════════════════════════
       PHASE 2: Template browser (Canva-style grid)
       ═══════════════════════════════════════════════════════════ */
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] -m-6 lg:-m-8">
            {/* Applying overlay */}
            {applying && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <p className="text-sm font-medium">Applying template & opening editor...</p>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <div className="border-b border-border bg-card px-6 py-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => isFlyer ? setPhase('describe') : navigate('/dashboard/campaigns')}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">
                            {isFlyer ? 'Choose a Flyer Template' : 'Choose a Template'}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            for <span className="font-semibold text-foreground">{campaign.business_name}</span>
                            {' '}&mdash; {campaign.name}
                            {aiContent && (
                                <span className="ml-2 text-green-600 font-medium">
                                    ✓ AI content ready
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search templates..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Category tabs */}
                <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 -mb-1">
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.id
                        return (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                {cat.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {/* Create Blank */}
                    <button onClick={handleCreateBlank}
                        className="group rounded-2xl border-2 border-dashed border-border hover:border-primary/60 overflow-hidden transition-all hover:shadow-lg text-left">
                        <div className="aspect-[9/16] flex flex-col items-center justify-center bg-muted/30 group-hover:bg-primary/5 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Create blank</p>
                        </div>
                        <div className="p-2.5 bg-card border-t border-border">
                            <p className="text-xs font-semibold">Blank Canvas</p>
                            <p className="text-[10px] text-muted-foreground">Start from scratch</p>
                        </div>
                    </button>

                    {/* Template cards */}
                    {filtered.map((preset) => (
                        <button key={preset.id}
                            onClick={() => handleSelectTemplate(preset)}
                            onMouseEnter={() => setHoveredId(preset.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            disabled={applying}
                            className="group rounded-2xl border-2 border-border hover:border-primary/60 overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] text-left disabled:opacity-50 disabled:pointer-events-none relative">
                            <TemplateMiniPreview preset={preset} />
                            {/* Hover overlay */}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 rounded-t-xl ${hoveredId === preset.id ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-lg">
                                    Customise this template
                                </div>
                            </div>
                            {/* Card footer */}
                            <div className="p-2.5 bg-card border-t border-border">
                                <p className="text-xs font-semibold truncate">{preset.name}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{preset.category}</p>
                            </div>
                        </button>
                    ))}

                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No templates match your search</p>
                            <button onClick={() => { setSearchQuery(''); setActiveCategory('all') }}
                                className="text-xs text-primary hover:underline mt-2">Clear filters</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border bg-card/90 backdrop-blur-sm py-3 px-6 flex items-center justify-between shrink-0">
                <p className="text-xs text-muted-foreground">
                    {filtered.length} templates available
                    {activeCategory !== 'all' && ` in ${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}`}
                </p>
                <button onClick={handleCreateBlank}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    Skip — open blank canvas editor
                </button>
            </div>
        </div>
    )
}
