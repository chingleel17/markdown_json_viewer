// Line numbers functionality
export function updateLineNumbers(textarea: HTMLTextAreaElement, lineNumbersEl: HTMLElement): void {
  const lines = textarea.value.split('\n');
  const lineCount = lines.length;
  lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
}

export function syncScroll(textarea: HTMLTextAreaElement, lineNumbersEl: HTMLElement): void {
  lineNumbersEl.scrollTop = textarea.scrollTop;
}

export function setupLineNumbers(textareaId: string, lineNumbersId: string): void {
  const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
  const lineNumbersEl = document.getElementById(lineNumbersId) as HTMLElement;
  
  if (!textarea || !lineNumbersEl) return;

  updateLineNumbers(textarea, lineNumbersEl);
  
  textarea.addEventListener('input', () => updateLineNumbers(textarea, lineNumbersEl));
  textarea.addEventListener('scroll', () => syncScroll(textarea, lineNumbersEl));
}

export {};
