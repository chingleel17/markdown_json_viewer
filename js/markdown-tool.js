document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const markdownOutput = document.getElementById('markdown-output');
    const clearBtn = document.getElementById('btn-clear-markdown');

    // Initial conversion for any default text
    if (markdownInput.value) {
        markdownOutput.innerHTML = marked.parse(markdownInput.value);
    }

    // Live preview on input
    markdownInput.addEventListener('input', () => {
        const markdownText = markdownInput.value;
        markdownOutput.innerHTML = marked.parse(markdownText);
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        markdownInput.value = '';
        markdownOutput.innerHTML = '';
    });
});
