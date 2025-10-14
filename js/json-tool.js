document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const jsonInput = document.getElementById("json-input");
  const jsonOutput = document.getElementById("json-output");
  const jsonTreeOutput = document.getElementById("json-tree-output");
  const processBtn = document.getElementById("btn-process-json");
  const minifyBtn = document.getElementById("btn-minify-json");
  const copyBtn = document.getElementById("btn-copy-json");
  const clearBtn = document.getElementById("btn-clear-json");
  const jsonStatus = document.getElementById("json-status");
  const jsonErrorMessage = document.getElementById("json-error-message");
  const actionFormatRadio = document.getElementById("json-action-format");
  const actionSchemaRadio = document.getElementById("json-action-schema");
  const textModeRadio = document.getElementById("text-mode");
  const treeModeRadio = document.getElementById("tree-mode");
  const jsonLineNumbers = document.getElementById("json-line-numbers");

  let currentJSON = null;
  let lineNumberManager = null;

  // Initialize line number manager
  if (jsonInput && jsonLineNumbers) {
    lineNumberManager = new LineNumberManager(jsonInput, jsonLineNumbers);
  }

  // --- Functions ---

  function triggerGlow(element) {
    element.classList.remove("glow-success");
    setTimeout(() => {
      element.classList.add("glow-success");
    }, 10);
  }

  function highlightJSON(jsonString) {
    return jsonString
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(
        /"([^"]*)"(?=\s*[,\}\]])/g,
        '<span class="json-string">"$1"</span>'
      )
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
      .replace(/[\[\]]/g, '<span class="json-bracket">$&</span>')
      .replace(/[\{\}]/g, '<span class="json-brace">$&</span>')
      .replace(/,/g, '<span class="json-comma">,</span>')
      .replace(/:/g, '<span class="json-colon">:</span>');
  }

  function createTreeView(obj, level = 0) {
    const indent = "  ".repeat(level);
    let html = "";

    if (Array.isArray(obj)) {
      html += `<div class="json-tree-item">`;
      html += `<span class="json-tree-toggle">▼</span>`;
      html += `<span class="json-bracket">[</span>`;
      html += `<div class="json-tree-children">`;
      obj.forEach((item, index) => {
        html += `<div class="json-tree-item">`;
        html += `<span class="json-key">${index}</span><span class="json-colon">:</span>`;
        if (typeof item === "object" && item !== null) {
          html += createTreeView(item, level + 1);
        } else {
          html += `<span class="json-tree-value">${formatValue(item)}</span>`;
        }
        if (index < obj.length - 1) html += '<span class="json-comma">,</span>';
        html += `</div>`;
      });
      html += `</div>`;
      html += `<span class="json-bracket">]</span>`;
      html += `</div>`;
    } else if (typeof obj === "object" && obj !== null) {
      html += `<div class="json-tree-item">`;
      html += `<span class="json-tree-toggle">▼</span>`;
      html += `<span class="json-brace">{</span>`;
      html += `<div class="json-tree-children">`;
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        html += `<div class="json-tree-item">`;
        html += `<span class="json-key">"${key}"</span><span class="json-colon">:</span>`;
        if (typeof obj[key] === "object" && obj[key] !== null) {
          html += createTreeView(obj[key], level + 1);
        } else {
          html += `<span class="json-tree-value">${formatValue(
            obj[key]
          )}</span>`;
        }
        if (index < keys.length - 1)
          html += '<span class="json-comma">,</span>';
        html += `</div>`;
      });
      html += `</div>`;
      html += `<span class="json-brace">}</span>`;
      html += `</div>`;
    }

    return html;
  }

  function formatValue(value) {
    if (typeof value === "string") {
      return `<span class="json-string">"${value}"</span>`;
    } else if (typeof value === "number") {
      return `<span class="json-number">${value}</span>`;
    } else if (typeof value === "boolean") {
      return `<span class="json-boolean">${value}</span>`;
    } else if (value === null) {
      return `<span class="json-null">null</span>`;
    }
    return value;
  }

  function updateDisplay() {
    if (!currentJSON) return;

    const action = actionFormatRadio.checked ? "format" : "schema";
    let displayData = currentJSON;

    if (action === "schema") {
      displayData = generateSchema(currentJSON);
    }

    if (textModeRadio.checked) {
      jsonOutput.style.display = "block";
      jsonTreeOutput.style.display = "none";
      const formatted = JSON.stringify(displayData, null, 2);
      jsonOutput.innerHTML = highlightJSON(formatted);
    } else {
      jsonOutput.style.display = "none";
      jsonTreeOutput.style.display = "block";
      jsonTreeOutput.innerHTML = `<div class="json-tree">${createTreeView(
        displayData
      )}</div>`;

      // Add toggle functionality
      jsonTreeOutput.querySelectorAll(".json-tree-toggle").forEach((toggle) => {
        toggle.addEventListener("click", () => {
          const children = toggle.parentElement.querySelector(
            ".json-tree-children"
          );
          if (children) {
            if (children.classList.contains("json-tree-collapsed")) {
              children.classList.remove("json-tree-collapsed");
              toggle.textContent = "▼";
            } else {
              children.classList.add("json-tree-collapsed");
              toggle.textContent = "▶";
            }
          }
        });
      });
    }
  }

  function validateAndUpdate(text) {
    jsonErrorMessage.textContent = "";
    if (text.trim() === "") {
      jsonStatus.innerHTML = "";
      jsonOutput.textContent = "";
      jsonTreeOutput.innerHTML = "";
      currentJSON = null;
      return {
        isValid: false,
        json: null,
      };
    }
    try {
      const parsed = JSON.parse(text);
      jsonStatus.innerHTML = '<span class="badge bg-success">Valid</span>';
      currentJSON = parsed;
      return {
        isValid: true,
        json: parsed,
      };
    } catch (e) {
      jsonStatus.innerHTML = '<span class="badge bg-danger">Invalid</span>';
      jsonErrorMessage.textContent = `無效的 JSON 格式: ${e.message}`;
      jsonOutput.textContent = "";
      jsonTreeOutput.innerHTML = "";
      currentJSON = null;
      return {
        isValid: false,
        json: null,
      };
    }
  }

  function generateSchema(json) {
    const type = Object.prototype.toString
      .call(json)
      .slice(8, -1)
      .toLowerCase();
    let schema = {
      type: type,
    };

    switch (type) {
      case "object":
        schema.properties = {};
        schema.required = Object.keys(json);
        for (const key in json) {
          if (Object.hasOwnProperty.call(json, key)) {
            schema.properties[key] = generateSchema(json[key]);
          }
        }
        break;
      case "array":
        schema.items = {};
        if (json.length > 0) {
          schema.items = generateSchema(json[0]);
        }
        break;
      case "null":
      case "string":
      case "number":
      case "boolean":
        break;
    }
    return schema;
  }

  // --- Event Listeners ---

  jsonInput.addEventListener("input", () => {
    validateAndUpdate(jsonInput.value);
  });

  processBtn.addEventListener("click", () => {
    const { isValid } = validateAndUpdate(jsonInput.value);
    if (isValid) {
      updateDisplay();
      const activeOutput = textModeRadio.checked ? jsonOutput : jsonTreeOutput;
      triggerGlow(activeOutput);
    }
  });

  // View mode and action change listeners
  textModeRadio.addEventListener("change", updateDisplay);
  treeModeRadio.addEventListener("change", updateDisplay);
  actionFormatRadio.addEventListener("change", updateDisplay);
  actionSchemaRadio.addEventListener("change", updateDisplay);

  minifyBtn.addEventListener("click", () => {
    if (currentJSON) {
      const action = actionFormatRadio.checked ? "format" : "schema";
      const displayData =
        action === "schema" ? generateSchema(currentJSON) : currentJSON;

      if (textModeRadio.checked) {
        jsonOutput.style.display = "block";
        jsonTreeOutput.style.display = "none";
        const minified = JSON.stringify(displayData);
        jsonOutput.innerHTML = highlightJSON(minified);
        triggerGlow(jsonOutput);
      }
    }
  });

  copyBtn.addEventListener("click", () => {
    const originalText = copyBtn.innerHTML;
    let textToCopy = "";

    if (textModeRadio.checked && jsonOutput.textContent) {
      textToCopy = jsonOutput.textContent;
    } else if (treeModeRadio.checked && currentJSON) {
      const action = actionFormatRadio.checked ? "format" : "schema";
      const displayData =
        action === "schema" ? generateSchema(currentJSON) : currentJSON;
      textToCopy = JSON.stringify(displayData, null, 2);
    }

    if (navigator.clipboard && textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          copyBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Copied!';
          setTimeout(() => (copyBtn.innerHTML = originalText), 2000);
        })
        .catch(() => {
          alert("Failed to copy.");
        });
    }
  });

  clearBtn.addEventListener("click", () => {
    jsonInput.value = "";
    jsonOutput.textContent = "";
    jsonTreeOutput.innerHTML = "";
    jsonStatus.innerHTML = "";
    jsonErrorMessage.textContent = "";
    currentJSON = null;
    if (lineNumberManager) {
      lineNumberManager.clear();
    }
  });
});
