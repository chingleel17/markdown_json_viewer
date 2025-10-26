// JSON Tool Implementation
import { setupLineNumbers } from './line-numbers';

interface JSONSchema {
    type: string;
    properties?: Record<string, any>;
    items?: any;
    [key: string]: any;
}

let currentJSON: any = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupLineNumbers('json-input', 'json-line-numbers');

    const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
    const jsonOutput = document.getElementById('json-output') as HTMLPreElement;
    const jsonTreeOutput = document.getElementById('json-tree-output') as HTMLDivElement;
    const jsonStatus = document.getElementById('json-status') as HTMLSpanElement;
    const jsonError = document.getElementById('json-error-message') as HTMLDivElement;
    const btnProcess = document.getElementById('btn-process-json') as HTMLButtonElement;
    const btnClear = document.getElementById('btn-clear-json') as HTMLButtonElement;
    const btnCopy = document.getElementById('btn-copy-json') as HTMLButtonElement;
    const btnMinify = document.getElementById('btn-minify-json') as HTMLButtonElement;

    // Input validation
    jsonInput?.addEventListener('input', () => {
        try {
            if (jsonInput.value.trim()) {
                currentJSON = JSON.parse(jsonInput.value);
                jsonStatus.textContent = '✓ 有效';
                jsonStatus.className = 'status-indicator text-success';
                jsonError.textContent = '';
            } else {
                jsonStatus.textContent = '';
                jsonError.textContent = '';
            }
        } catch (e: any) {
            jsonStatus.textContent = '✗ 無效';
            jsonStatus.className = 'status-indicator text-danger';
            jsonError.textContent = `錯誤: ${e.message}`;
        }
    });

    // Process JSON
    btnProcess?.addEventListener('click', () => {
        const action = (document.querySelector('input[name="json-action"]:checked') as HTMLInputElement)?.value;
        const viewMode = (document.querySelector('input[name="json-view-mode"]:checked') as HTMLInputElement)?.value;

        try {
            if (!jsonInput.value.trim()) {
                throw new Error('請輸入 JSON');
            }

            currentJSON = JSON.parse(jsonInput.value);

            if (action === 'format') {
                const formatted = JSON.stringify(currentJSON, null, 2);
                if (viewMode === 'tree') {
                    jsonOutput.style.display = 'none';
                    jsonTreeOutput.style.display = 'block';
                    jsonTreeOutput.innerHTML = renderJSONTree(currentJSON);
                } else {
                    jsonOutput.style.display = 'block';
                    jsonTreeOutput.style.display = 'none';
                    jsonOutput.textContent = formatted;
                }
            } else if (action === 'schema') {
                const schema = generateJSONSchema(currentJSON);
                jsonOutput.style.display = 'block';
                jsonTreeOutput.style.display = 'none';
                jsonOutput.textContent = JSON.stringify(schema, null, 2);
            }
        } catch (e: any) {
            jsonError.textContent = `錯誤: ${e.message}`;
        }
    });

    // Clear
    btnClear?.addEventListener('click', () => {
        jsonInput.value = '';
        jsonOutput.textContent = '';
        jsonTreeOutput.innerHTML = '';
        jsonStatus.textContent = '';
        jsonError.textContent = '';
        currentJSON = null;
    });

    // Copy
    btnCopy?.addEventListener('click', async () => {
        const text = jsonOutput.style.display === 'none'
            ? jsonTreeOutput.textContent || ''
            : jsonOutput.textContent || '';

        try {
            await navigator.clipboard.writeText(text);
            btnCopy.innerHTML = '<i class="bi bi-check me-1"></i> 已複製';
            setTimeout(() => {
                btnCopy.innerHTML = '<i class="bi bi-clipboard me-1"></i> 複製';
            }, 2000);
        } catch (e) {
            alert('複製失敗');
        }
    });

    // Minify
    btnMinify?.addEventListener('click', () => {
        if (currentJSON) {
            jsonOutput.style.display = 'block';
            jsonTreeOutput.style.display = 'none';
            jsonOutput.textContent = JSON.stringify(currentJSON);
        }
    });

    // View mode change
    document.querySelectorAll('input[name="json-view-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentJSON) {
                btnProcess.click();
            }
        });
    });
});

function renderJSONTree(obj: any, level: number = 0): string {
    const indent = '  '.repeat(level);
    let html = '';

    if (Array.isArray(obj)) {
        html += `<div class="json-array">${indent}[</div>`;
        obj.forEach((item, i) => {
            html += renderJSONTree(item, level + 1);
            if (i < obj.length - 1) html += ',';
        });
        html += `<div>${indent}]</div>`;
    } else if (typeof obj === 'object' && obj !== null) {
        html += `<div class="json-object">${indent}{</div>`;
        const keys = Object.keys(obj);
        keys.forEach((key, i) => {
            html += `<div class="json-key">${indent}  "<span class="text-primary">${key}</span>": `;
            html += renderJSONTree(obj[key], level + 1);
            if (i < keys.length - 1) html += ',';
            html += `</div>`;
        });
        html += `<div>${indent}}</div>`;
    } else if (typeof obj === 'string') {
        html += `<span class="json-string">"${obj}"</span>`;
    } else if (typeof obj === 'number') {
        html += `<span class="json-number">${obj}</span>`;
    } else if (typeof obj === 'boolean') {
        html += `<span class="json-boolean">${obj}</span>`;
    } else if (obj === null) {
        html += `<span class="json-null">null</span>`;
    }

    return html;
}

function generateJSONSchema(obj: any): JSONSchema {
    if (Array.isArray(obj)) {
        return {
            type: 'array',
            items: obj.length > 0 ? generateJSONSchema(obj[0]) : { type: 'string' }
        };
    } else if (typeof obj === 'object' && obj !== null) {
        const properties: Record<string, any> = {};
        Object.keys(obj).forEach(key => {
            properties[key] = generateJSONSchema(obj[key]);
        });
        return {
            type: 'object',
            properties
        };
    } else if (typeof obj === 'string') {
        return { type: 'string' };
    } else if (typeof obj === 'number') {
        return { type: 'number' };
    } else if (typeof obj === 'boolean') {
        return { type: 'boolean' };
    } else {
        return { type: 'null' };
    }
}

export { };
