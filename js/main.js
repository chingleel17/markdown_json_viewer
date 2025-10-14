document.addEventListener("DOMContentLoaded", () => {
  const mainTabs = document.getElementById("myTab");
  const defaultTabId = "#json-tool-pane";

  // 全螢幕模式相關元素
  const fullscreenToggle = document.getElementById("fullscreen-toggle");
  const body = document.body;

  // Function to show a tab based on a hash
  const showTabFromHash = () => {
    let hash = window.location.hash;
    // If the hash is invalid or empty, use the default
    if (!hash || !document.querySelector(`[data-bs-target="${hash}"]`)) {
      hash = defaultTabId;
    }

    const tabTrigger = document.querySelector(`[data-bs-target="${hash}"]`);
    if (tabTrigger) {
      const tab = new bootstrap.Tab(tabTrigger);
      tab.show();
    }
  };

  // 全螢幕模式切換函數
  const toggleFullscreen = () => {
    const isFullscreen = body.classList.contains("fullscreen-mode");

    if (isFullscreen) {
      // 退出全螢幕模式
      body.classList.remove("fullscreen-mode");
      fullscreenToggle.classList.remove("fullscreen-active");
      fullscreenToggle.title = "全螢幕模式";
    } else {
      // 進入全螢幕模式
      body.classList.add("fullscreen-mode");
      fullscreenToggle.classList.add("fullscreen-active");
      fullscreenToggle.title = "退出全螢幕";

      // 確保當前顯示的是 JSON 工具標籤頁
      const jsonTab = document.querySelector(
        '[data-bs-target="#json-tool-pane"]'
      );
      if (jsonTab) {
        const tab = new bootstrap.Tab(jsonTab);
        tab.show();
      }
    }
  };

  // 全螢幕按鈕事件監聽器
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener("click", toggleFullscreen);
  }

  // 當切換到非 JSON 工具標籤頁時，自動退出全螢幕模式
  mainTabs.addEventListener("show.bs.tab", (event) => {
    const newHash = event.target.dataset.bsTarget;
    // Use pushState to allow back/forward navigation
    if (window.location.hash !== newHash) {
      history.pushState(null, null, newHash);
    }

    // 如果切換到非 JSON 工具標籤頁，退出全螢幕模式
    if (
      newHash !== "#json-tool-pane" &&
      body.classList.contains("fullscreen-mode")
    ) {
      toggleFullscreen();
    }
  });

  // When the user navigates with back/forward buttons, show the correct tab
  window.addEventListener("popstate", () => {
    showTabFromHash();
  });

  // ESC 鍵退出全螢幕模式
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("fullscreen-mode")) {
      toggleFullscreen();
    }
  });

  // Show the correct tab on initial page load
  showTabFromHash();
});
