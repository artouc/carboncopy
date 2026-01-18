/**
 * JapaneseDetector - 日本語文字の検出
 *
 * テキスト内の日本語文字（ひらがな、カタカナ、漢字）を検出し、
 * フォールバックフォントの使用が必要かどうかを判定する。
 */

/**
 * 文字が日本語かどうかを判定
 *
 * 以下のUnicodeブロックを日本語として判定:
 * - ひらがな: U+3040-U+309F
 * - カタカナ: U+30A0-U+30FF
 * - カタカナ拡張: U+31F0-U+31FF
 * - 半角カタカナ: U+FF65-U+FF9F
 * - CJK統合漢字: U+4E00-U+9FFF
 * - CJK統合漢字拡張A: U+3400-U+4DBF
 * - CJK互換漢字: U+F900-U+FAFF
 * - CJK統合漢字拡張B-G: U+20000-U+3134F
 * - 日本語句読点: U+3000-U+303F
 */
export function isJapaneseChar(codePoint: number): boolean {
    // ひらがな
    if (codePoint >= 0x3040 && codePoint <= 0x309F) return true
    // カタカナ
    if (codePoint >= 0x30A0 && codePoint <= 0x30FF) return true
    // カタカナ拡張
    if (codePoint >= 0x31F0 && codePoint <= 0x31FF) return true
    // 半角カタカナ
    if (codePoint >= 0xFF65 && codePoint <= 0xFF9F) return true
    // CJK統合漢字
    if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return true
    // CJK統合漢字拡張A
    if (codePoint >= 0x3400 && codePoint <= 0x4DBF) return true
    // CJK互換漢字
    if (codePoint >= 0xF900 && codePoint <= 0xFAFF) return true
    // CJK統合漢字拡張B-G (サロゲートペア)
    if (codePoint >= 0x20000 && codePoint <= 0x3134F) return true
    // 日本語句読点・記号
    if (codePoint >= 0x3000 && codePoint <= 0x303F) return true
    // 全角英数字・記号
    if (codePoint >= 0xFF01 && codePoint <= 0xFF5E) return true

    return false
}

/**
 * 文字がASCII範囲内（標準フォントで表示可能）かどうかを判定
 */
export function isAsciiChar(codePoint: number): boolean {
    return codePoint >= 0x0020 && codePoint <= 0x007E
}

/**
 * テキストに日本語文字が含まれているかを判定
 */
export function containsJapanese(text: string): boolean {
    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined && isJapaneseChar(codePoint)) {
            return true
        }
    }
    return false
}

/**
 * テキストから日本語文字のみを抽出
 */
export function extractJapaneseChars(text: string): string {
    let result = ""
    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined && isJapaneseChar(codePoint)) {
            result += char
        }
    }
    return result
}

/**
 * テキストから非ASCII文字（日本語含む）を抽出
 */
export function extractNonAsciiChars(text: string): string {
    let result = ""
    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined && !isAsciiChar(codePoint)) {
            result += char
        }
    }
    return result
}

/**
 * テキストを日本語と非日本語に分割
 *
 * 連続する同じカテゴリの文字をグループ化
 */
export interface TextSegment {
    text: string
    is_japanese: boolean
}

export function segmentText(text: string): TextSegment[] {
    if (!text) return []

    const segments: TextSegment[] = []
    let current_text = ""
    let current_is_japanese: boolean | null = null

    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint === undefined) continue

        const is_japanese = isJapaneseChar(codePoint)

        if (current_is_japanese === null) {
            current_is_japanese = is_japanese
            current_text = char
        } else if (is_japanese === current_is_japanese) {
            current_text += char
        } else {
            segments.push({
                text: current_text,
                is_japanese: current_is_japanese,
            })
            current_text = char
            current_is_japanese = is_japanese
        }
    }

    if (current_text && current_is_japanese !== null) {
        segments.push({
            text: current_text,
            is_japanese: current_is_japanese,
        })
    }

    return segments
}

/**
 * テキストから使用されている全コードポイントを収集
 */
export function collectCodePoints(text: string): Set<number> {
    const code_points = new Set<number>()
    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined) {
            code_points.add(codePoint)
        }
    }
    return code_points
}

/**
 * テキストからフォント埋め込みに必要な文字を収集
 *
 * 標準フォントで表示できない文字（日本語等）のみを返す
 */
export function collectEmbedRequiredChars(text: string): Set<number> {
    const code_points = new Set<number>()
    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined && !isAsciiChar(codePoint)) {
            code_points.add(codePoint)
        }
    }
    return code_points
}

/**
 * テキストの日本語文字の割合を計算
 */
export function calculateJapaneseRatio(text: string): number {
    if (!text) return 0

    let total = 0
    let japanese_count = 0

    for (const char of text) {
        const codePoint = char.codePointAt(0)
        if (codePoint !== undefined) {
            total++
            if (isJapaneseChar(codePoint)) {
                japanese_count++
            }
        }
    }

    return total > 0 ? japanese_count / total : 0
}
