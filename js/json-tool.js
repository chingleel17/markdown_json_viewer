
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const formatBtn = document.getElementById('btn-format-json');
    const minifyBtn = document.getElementById('btn-minify-json');
    const copyBtn = document.getElementById('btn-copy-json');
    const clearBtn = document.getElementById('btn-clear-json');
    const jsonStatus = document.getElementById('json-status');

    // --- Functions ---

    function triggerGlow(element) {
        element.classList.remove('glow-success');
        // Use a timeout to allow the browser to remove the class before re-adding it
        setTimeout(() => {
            element.classList.add('glow-success');
        }, 10);
    }

    function validateAndUpdate(text) {
        if (text.trim() === '') {
            jsonStatus.innerHTML = '';
            return false;
        }
        try {
            JSON.parse(text);
            jsonStatus.innerHTML = '<span class="badge bg-success">Valid</span>';
            return true;
        } catch (e) {
            jsonStatus.innerHTML = '<span class="badge bg-danger">Invalid</span>';
            jsonOutput.textContent = `Error: ${e.message}`;
            return false;
        }
    }

    // --- Event Listeners ---

    // Live validation on input
    jsonInput.addEventListener('input', () => {
        validateAndUpdate(jsonInput.value);
    });

    // Format JSON
    formatBtn.addEventListener('click', () => {
        if (validateAndUpdate(jsonInput.value)) {
            const parsed = JSON.parse(jsonInput.value);
            jsonOutput.textContent = JSON.stringify(parsed, null, 2);
            triggerGlow(jsonOutput);
        }
    });

    // Minify JSON
    minifyBtn.addEventListener('click', () => {
        if (validateAndUpdate(jsonInput.value)) {
            const parsed = JSON.parse(jsonInput.value);
            jsonOutput.textContent = JSON.stringify(parsed);
            triggerGlow(jsonOutput);
        }
    });

    // Copy output to clipboard
    copyBtn.addEventListener('click', () => {
        const originalText = copyBtn.innerHTML;
        if (navigator.clipboard && jsonOutput.textContent) {
            navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
                copyBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Copied!';
                setTimeout(() => copyBtn.innerHTML = originalText, 2000);
            }).catch(() => {
                alert('Failed to copy.');
            });
        }
    });

    // Clear inputs and outputs
    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        jsonOutput.textContent = '';
        jsonStatus.innerHTML = '';
    });
});
