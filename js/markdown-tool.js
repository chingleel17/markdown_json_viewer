document.addEventListener("DOMContentLoaded", () => {
  const markdownInput = document.getElementById("markdown-input");
  const markdownOutput = document.getElementById("markdown-output");
  const clearBtn = document.getElementById("btn-clear-markdown");
  const lineNumbers = document.getElementById("markdown-line-numbers");

  let lineNumberManager = null;

  // Initialize line number manager
  if (markdownInput && lineNumbers) {
    lineNumberManager = new LineNumberManager(markdownInput, lineNumbers);
  }

  function updatePreview() {
    const markdownText = markdownInput.value;
    if (markdownText.trim() === "") {
      markdownOutput.innerHTML =
        '<div class="text-muted p-3">Markdown 預覽將在此顯示...</div>';
    } else {
      markdownOutput.innerHTML = marked.parse(markdownText);
    }
  }

  // Initial conversion for any default text
  if (markdownInput.value) {
    markdownOutput.innerHTML = marked.parse(markdownInput.value);
  }

  // Live preview on input
  markdownInput.addEventListener("input", updatePreview);

  // Clear button
  clearBtn.addEventListener("click", () => {
    markdownInput.value = "";
    markdownOutput.innerHTML =
      '<div class="text-muted p-3">Markdown 預覽將在此顯示...</div>';
    if (lineNumberManager) {
      lineNumberManager.clear();
    }
  });

  // Initialize
  updatePreview();
});
