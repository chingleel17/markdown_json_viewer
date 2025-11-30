// TOON Converter - Convert between JSON and TOON format using official library
// TOON (Token-Oriented Object Notation) is a lightweight format for LLMs
import { encode, decode } from '@toon-format/toon'

export interface ConversionStats {
    jsonTokens: number
    toonTokens: number
    jsonSize: number
    toonSize: number
    tokenSavings: number
    sizeSavings: number
}

// Estimate token count (rough approximation)
function estimateTokens(text: string): number {
    // Simple approximation: ~4 characters per token on average
    // This is a rough estimate, actual tokenization may vary
    return Math.ceil(text.length / 4)
}

// Convert JSON to TOON format
export function jsonToToon(jsonStr: string): { toon: string; stats: ConversionStats } {
    try {
        const data = JSON.parse(jsonStr)
        const toon = encode(data)

        const jsonTokens = estimateTokens(jsonStr)
        const toonTokens = estimateTokens(toon)
        const jsonSize = new Blob([jsonStr]).size
        const toonSize = new Blob([toon]).size

        const stats: ConversionStats = {
            jsonTokens,
            toonTokens,
            jsonSize,
            toonSize,
            tokenSavings: Math.round(((jsonTokens - toonTokens) / jsonTokens) * 100),
            sizeSavings: Math.round(((jsonSize - toonSize) / jsonSize) * 100),
        }

        return { toon, stats }
    } catch (error) {
        throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Convert TOON to JSON format
export function toonToJson(toonStr: string): { json: string; stats: ConversionStats } {
    try {
        const data = decode(toonStr)
        const json = JSON.stringify(data, null, 2)

        const jsonTokens = estimateTokens(json)
        const toonTokens = estimateTokens(toonStr)
        const jsonSize = new Blob([json]).size
        const toonSize = new Blob([toonStr]).size

        const stats: ConversionStats = {
            jsonTokens,
            toonTokens,
            jsonSize,
            toonSize,
            tokenSavings: Math.round(((jsonTokens - toonTokens) / jsonTokens) * 100),
            sizeSavings: Math.round(((jsonSize - toonSize) / jsonSize) * 100),
        }

        return { json, stats }
    } catch (error) {
        throw new Error(`TOON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}
