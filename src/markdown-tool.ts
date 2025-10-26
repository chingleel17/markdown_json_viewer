// Markdown Tool Implementation
import { setupLineNumbers } from './line-numbers';

// Declare marked from CDN
declare const marked: any;

document.addEventListener('DOMContentLoaded', () => {
    setupLineNumbers('markdown-input', 'markdown-line-numbers');

    const markdownInput = document.getElementById('markdown-input') as HTMLTextAreaElement;
    const markdownOutput = document.getElementById('markdown-output') as HTMLDivElement;
    const btnClear = document.getElementById('btn-clear-markdown') as HTMLButtonElement;

    // Real-time preview
    markdownInput?.addEventListener('input', () => {
        if (typeof marked !== 'undefined') {
            markdownOutput.innerHTML = marked.parse(markdownInput.value);
        }
    });

    // Clear
    btnClear?.addEventListener('click', () => {
        markdownInput.value = '';
        markdownOutput.innerHTML = '';
    });
});

export { };
