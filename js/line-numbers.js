/**
 * 共用的行數功能模組
 * 為文本編輯器提供行數顯示和同步滾動功能
 */

class LineNumberManager {
  constructor(textareaElement, lineNumbersElement) {
    this.textarea = textareaElement;
    this.lineNumbers = lineNumbersElement;
    this.syncInProgress = false;

    this.init();
  }

  init() {
    this.updateLineNumbers();
    this.bindEvents();
  }

  bindEvents() {
    // 監聽文本變化
    this.textarea.addEventListener("input", () => {
      this.updateLineNumbers();
    });

    // 監聽滾動事件
    this.textarea.addEventListener("scroll", () => {
      this.syncScroll();
    });

    // 防止行數區域獨立滾動
    this.lineNumbers.addEventListener("scroll", (e) => {
      if (!this.syncInProgress) {
        e.preventDefault();
        // 強制同步回正確位置
        this.syncScroll();
      }
    });
  }

  updateLineNumbers() {
    const text = this.textarea.value;
    const lines = text.split("\n");
    const totalLines = Math.max(lines.length, 1);

    // 生成行數文字
    const lineNumbersText = Array.from(
      { length: totalLines },
      (_, i) => i + 1
    ).join("\n");

    this.lineNumbers.textContent = lineNumbersText;

    // 動態調整寬度
    const maxDigits = totalLines.toString().length;
    if (maxDigits > 2) {
      const newWidth = Math.max(60, maxDigits * 12 + 20);
      this.lineNumbers.style.minWidth = `${newWidth}px`;
      this.lineNumbers.style.maxWidth = `${newWidth}px`;
    }
  }

  syncScroll() {
    // 使用滾動比例同步，參考 Monaco Editor 的實現
    const scrollTop = this.textarea.scrollTop;
    const scrollHeight = this.textarea.scrollHeight;
    const clientHeight = this.textarea.clientHeight;

    // 計算最大可滾動距離
    const maxScrollTop = scrollHeight - clientHeight;

    // 如果無法滾動，則不需要同步
    if (maxScrollTop <= 0) {
      this.syncInProgress = true;
      this.lineNumbers.scrollTop = 0;
      this.syncInProgress = false;
      return;
    }

    // 計算滾動比例
    const scrollRatio = scrollTop / maxScrollTop;

    // 計算行數區域的目標滾動位置
    const lineNumbersScrollHeight = this.lineNumbers.scrollHeight;
    const lineNumbersClientHeight = this.lineNumbers.clientHeight;
    const lineNumbersMaxScroll =
      lineNumbersScrollHeight - lineNumbersClientHeight;

    // 應用滾動比例
    const targetScrollTop = Math.max(
      0,
      Math.min(lineNumbersMaxScroll, lineNumbersMaxScroll * scrollRatio)
    );

    // 設置標誌以防止循環觸發
    this.syncInProgress = true;
    this.lineNumbers.scrollTop = targetScrollTop;
    this.syncInProgress = false;
  }

  clear() {
    this.lineNumbers.textContent = "1";
    this.lineNumbers.scrollTop = 0;
  }

  destroy() {
    // 清理事件監聽器
    this.textarea.removeEventListener("input", this.updateLineNumbers);
    this.textarea.removeEventListener("scroll", this.syncScroll);
    this.lineNumbers.removeEventListener(
      "scroll",
      this.handleLineNumbersScroll
    );
  }
}

// 導出為全局可用
window.LineNumberManager = LineNumberManager;
