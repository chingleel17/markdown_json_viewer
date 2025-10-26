# 開發者工具箱 | DevTools Box

現代化開發者工具箱 - JSON 格式化、Markdown 預覽、文檔檢視器

## 功能特色

- **JSON 工具**: 格式化、驗證、壓縮 JSON，生成 JSON Schema
- **Markdown 預覽**: 即時預覽 Markdown 文件
- **Document 檢視器**: 檢視和搜尋 RAG 資料集
- **主題切換**: 支援明/暗主題
- **本地處理**: 所有操作均在瀏覽器本地進行，保障資料安全

## 技術栈

- **Vite**: 極速開發與打包工具
- **TypeScript**: 類型安全的 JavaScript
- **Bootstrap 5**: 響應式 UI 框架
- **Marked.js**: Markdown 解析器

## 開發流程

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 打包生產版本
npm run build

# 預覽生產版本
npm run preview
```

## Cloudflare Pages 部署

### 使用 Wrangler CLI

```bash
# 安裝 Wrangler
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 打包專案
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist
```

### 使用 Git 整合

1. 將專案推送到 GitHub
2. 在 Cloudflare Pages 連接 GitHub 儲存庫
3. 設定構建指令: `npm run build`
4. 設定輸出目錄: `dist`

## 目錄結構

```
.
├── src/
│   ├── main.ts           # 主入口
│   ├── style.css         # 全域樣式
│   ├── theme.ts          # 主題切換
│   ├── line-numbers.ts   # 行號功能
│   ├── json-tool.ts      # JSON 工具
│   ├── markdown-tool.ts  # Markdown 工具
│   └── document-viewer.ts # 文檔檢視器
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## License

Copyright © 2025 ching lee. All rights reserved.
