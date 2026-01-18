/**
 * FontConfig - フォント設定の型定義
 *
 * HTML to PDF変換時のカスタムフォント設定
 */

import type { LoadedFont } from "../fonts/FontManager.js"

/**
 * フォントソースの種類
 */
export type FontSource =
    | { type: "url"; url: string }
    | { type: "data"; data: ArrayBuffer | Uint8Array }
    | { type: "loaded"; font: LoadedFont }

/**
 * フォント設定
 */
export interface FontConfig {
    /** フォント名（CSS font-family と一致させる） */
    family: string
    /** フォントウェイト（デフォルト: 400） */
    weight?: number
    /** フォントスタイル（デフォルト: "normal"） */
    style?: "normal" | "italic"
    /** フォントソース */
    source: FontSource
}

/**
 * 日本語フォントフォールバック設定
 */
export interface JapaneseFontFallback {
    /** フォールバックフォントのソース */
    source: FontSource
    /** フォント名（省略時は自動検出） */
    family?: string
}

/**
 * フォント埋め込みオプション
 */
export interface FontEmbedOptions {
    /** カスタムフォント設定 */
    fonts?: FontConfig[]
    /** 日本語フォールバック設定 */
    japaneseFallback?: JapaneseFontFallback
    /** フォントサブセット化を有効にする（デフォルト: true） */
    subset?: boolean
}
