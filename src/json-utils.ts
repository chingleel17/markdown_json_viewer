// JSON processing utility functions

/**
 * Removes single-line (//) and multi-line (/* *&#47;) comments from a JSON string.
 *
 * This function preserves newline characters in place of removed comments to maintain
 * the original line numbers, which is important for error reporting and debugging.
 *
 * @param {string} jsonString - The JSON string potentially containing comments.
 * @returns {string} The JSON string with comments removed, but with newlines preserved.
 */
export function removeComments(jsonString: string): string {
    let result = '';
    let i = 0;

    while (i < jsonString.length) {
        // 檢查雙斜線註解
        if (i < jsonString.length - 1 && jsonString[i] === '/' && jsonString[i + 1] === '/') {
            // 跳過到行尾
            i += 2;
            while (i < jsonString.length && jsonString[i] !== '\n' && jsonString[i] !== '\r') {
                i++;
            }
            // 保留換行符
            if (jsonString[i] === '\r' && jsonString[i + 1] === '\n') {
                result += '\n';
                i += 2;
            } else if (jsonString[i] === '\n' || jsonString[i] === '\r') {
                result += '\n';
                i++;
            }
            continue;
        }

        // 檢查多行註解
        if (i < jsonString.length - 1 && jsonString[i] === '/' && jsonString[i + 1] === '*') {
            i += 2;
            while (i < jsonString.length - 1) {
                if (jsonString[i] === '*' && jsonString[i + 1] === '/') {
                    i += 2;
                    break;
                }
                // 保留換行以維持行號
                if (jsonString[i] === '\n') {
                    result += '\n';
                }
                i++;
            }
            continue;
        }

        // 處理字符串中的斜線（不是註解）
        if (jsonString[i] === '"') {
            result += jsonString[i];
            i++;
            while (i < jsonString.length) {
                if (jsonString[i] === '\\' && i + 1 < jsonString.length) {
                    result += jsonString[i];
                    result += jsonString[i + 1];
                    i += 2;
                } else if (jsonString[i] === '"') {
                    result += jsonString[i];
                    i++;
                    break;
                } else {
                    result += jsonString[i];
                    i++;
                }
            }
            continue;
        }

        result += jsonString[i];
        i++;
    }

    return result;
}

// Auto-fix common JSON format errors
export function autoFixJSON(jsonString: string): string {
    let fixed = jsonString;

    // Remove trailing commas (before closing braces/brackets, including with whitespace/newlines)
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Remove trailing commas before newlines (and optional following content)
    fixed = fixed.replace(/,(\s*\n\s*[}\]])/g, '$1');

    // Ensure keys are quoted with double quotes (simple cases)
    // Only apply regex outside of string literals
    fixed = quoteUnquotedKeysOutsideStrings(fixed);

    // Fix single quotes to double quotes
    // Note: This needs to be careful to avoid modifying single quotes inside JSON string values
    fixed = fixSingleQuotes(fixed);

    // Add missing commas between elements (closing value/bracket followed by new item without comma)
    // Match: value followed by newline and indentation, then opening of next item
    fixed = addMissingCommas(fixed);

    // Remove extra blank lines
    fixed = fixed.replace(/\n\s*\n/g, '\n');

    return fixed.trim();
}

// Add missing commas between JSON elements
function addMissingCommas(jsonString: string): string {
    // Pattern 1: closing quote followed by new line and then opening quote/bracket
    jsonString = jsonString.replace(/"\s*\n\s*"/g, '",\n"');

    // Pattern 2: closing bracket followed by new line and then opening bracket
    jsonString = jsonString.replace(/]\s*\n\s*[{\[]/g, (match) => {
        return match.replace(/]\s*\n/, '],\n');
    });

    // Pattern 3: closing brace followed by new line and then opening bracket
    jsonString = jsonString.replace(/}\s*\n\s*[{\[]/g, (match) => {
        return match.replace(/}\s*\n/, '},\n');
    });

    // Pattern 4: closing quote followed by new line and then opening bracket
    jsonString = jsonString.replace(/"\s*\n\s*[{\[]/g, (match) => {
        return match.replace(/"\s*\n/, '",\n');
    });

    // Pattern 5: value (number, boolean, null) followed by new line and opening bracket/quote
    jsonString = jsonString.replace(/(true|false|null)\s*\n\s*[{\["]/g, (match) => {
        const value = match.match(/(true|false|null)/)?.[0] || '';
        const nextChar = match.match(/[{\["]/)?.[0] || '';
        return value + ',\n' + nextChar;
    });

    // Pattern 6: number followed by new line and opening bracket/quote
    jsonString = jsonString.replace(/(\d)\s*\n\s*[{\["]/g, (match) => {
        const number = match.match(/\d/)?.[0] || '';
        const nextChar = match.match(/[{\["]/)?.[0] || '';
        return number + ',\n' + nextChar;
    });

    return jsonString;
}

// Convert single quotes to double quotes (for keys and values), handling escaped single quotes
function fixSingleQuotes(jsonString: string): string {
    let result = '';
    let i = 0;
    let inDoubleQuotes = false;
    let inSingleQuotes = false;
    let escape = false;

    while (i < jsonString.length) {
        const char = jsonString[i];

        if (inDoubleQuotes) {
            result += char;
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inDoubleQuotes = false;
            }
            i++;
        } else if (inSingleQuotes) {
            if (escape) {
                // Preserve the escape sequence
                result += '\\' + char;
                escape = false;
                i++;
            } else if (char === '\\') {
                escape = true;
                i++;
            } else if (char === "'") {
                result += '"';
                inSingleQuotes = false;
                i++;
            } else {
                result += char;
                i++;
            }
        } else {
            if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
                inDoubleQuotes = true;
                result += char;
                i++;
            } else if (char === "'" && (i === 0 || jsonString[i - 1] !== '\\')) {
                inSingleQuotes = true;
                result += '"';
                i++;
            } else {
                result += char;
                i++;
            }
        }
    }

    return result;
}

// Quote unquoted keys outside of string literals
function quoteUnquotedKeysOutsideStrings(jsonString: string): string {
    let result = '';
    let inString = false;
    let escape = false;
    let buffer = '';
    for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        if (inString) {
            buffer += char;
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
        } else {
            if (char === '"') {
                inString = true;
                buffer += char;
            } else {
                // Try to match unquoted key pattern at this position
                const match = jsonString.slice(i).match(/^([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/);
                if (match) {
                    buffer += match[1] + '"' + match[2] + '"' + match[3];
                    i += match[0].length - 1;
                } else {
                    buffer += char;
                }
            }
        }
    }
    result = buffer;
    return result;
}

// Validate and parse JSON (with comment support)
export function validateAndParseJSON(jsonString: string): { valid: boolean; data: any; error?: string } {
    if (!jsonString.trim()) {
        return { valid: false, data: null, error: 'Input is empty' };
    }

    try {
        // First remove comments
        const cleaned = removeComments(jsonString);

        // Try to parse
        const data = JSON.parse(cleaned);
        return { valid: true, data };
    } catch (error: any) {
        // If parsing fails, try auto-fix
        try {
            const cleaned = removeComments(jsonString);
            const fixed = autoFixJSON(cleaned);
            const data = JSON.parse(fixed);
            return { valid: true, data, error: undefined };
        } catch (fixError: any) {
            return {
                valid: false,
                data: null,
                error: fixError.message
            };
        }
    }
}

// Try to repair JSON and return the repaired string
export function attemptJSONRepair(jsonString: string): { success: boolean; repaired: string; error?: string } {
    if (!jsonString.trim()) {
        return { success: false, repaired: '', error: 'Input is empty' };
    }

    try {
        // First remove comments
        const cleaned = removeComments(jsonString);

        // Try to parse, if successful return cleaned version
        JSON.parse(cleaned);
        return { success: true, repaired: cleaned };
    } catch (error: any) {
        // Try auto-fix
        try {
            const cleaned = removeComments(jsonString);
            const fixed = autoFixJSON(cleaned);
            JSON.parse(fixed);
            return { success: true, repaired: fixed };
        } catch (fixError: any) {
            return {
                success: false,
                repaired: '',
                error: fixError.message
            };
        }
    }
}