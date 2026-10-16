# v0.4 全體人物驗證 — 2026-10-16

- 新增 9 張模型人物圖集，全部 11 位／33 表情，檔案為 780 × 260 WebP；新檔均有透明 alpha，合計人物 746,636 bytes。未使用 SVG 人物。
- Edge 無頭瀏覽器檢查 11 組人物、33 個不重複且正確的姓名與表情替代文字，圖片全部載入；360／390／1280px 無水平溢出。
- `tests/art_preview_test.cjs` 通過：六頁樣稿、按鈕、圖層、故事略過及減少動態，既有六黨各跑完五屆且無 JS 錯誤。此為原版六黨回歸測試，不宣稱七觀點整合已完成。
- `node build.mjs --check`、`node --check src/art-preview.js`、`node --check src/game.js` 通過。主遊戲程式與建置產出未變動。
- 截圖在 `docs/screenshots/art-v04/`。尚未驗證正式遊戲中的新人物整合、深色模式或 Artifact 外部素材載入。

# 美術樣稿 v0.2 驗證紀錄

## v0.3 模型插畫更新驗證（2026-10-16）

- 同一套 `tests/art_preview_test.cjs` 已在更換素材後重跑通過：六個畫面、360／390／1280px、正文放大、控制項、圖層與圖例、動畫略過及系統減少動態。
- 既有六黨各完整五屆到達 final，無 pageerror，反思摘要檢查通過。
- 手機截圖更新於 `docs/screenshots/art-v03/`，已人工檢視人物六種表情、新聞島嶼與故事畫面。
- 4 個 WebP 均寬 780px，manifest 大小一致；人物和服務物件圖集均保留 alpha 透明背景。manifest 沒有任何 SVG 人物項目，六張 SVG 人物檔已移除。
- `node build.mjs --check`、樣稿語法、diff 空白檢查通過；正式遊戲程式沒有內容變動。
- 使用內建 imagegen 生成插畫，WebP 只做交付尺寸與格式轉換；無 SVG 人物描圖。

以下為 v0.2 的歷史紀錄；舊人物 SVG 已由 v0.3 圖集取代，正式整合以 `art-painted-v03.md` 為準。

日期：2026-10-16。環境：Windows、Node 24.18.0、Playwright 搭配本機 Edge（headless）。本次是樣稿驗證與基準版回歸，不是七黨新版、政策平衡或學習效果測試。

## 通過

- `node build.mjs --check`：正式遊戲產出與既有來源一致。
- `node --check src/game.js`、`node --check src/art-preview.js`：語法通過。
- `git diff --check`：無空白錯誤。
- `tests/art_preview_test.cjs`：六頁 390×844 手機樣稿、360／390／1280px 不橫向溢位、正文 110% 放大檢查、可見控制項至少 48px。
- 390px 預算首屏：第二張收合政策卡完整位於底部操作列上方。
- 政策卡：責任欄位展開／收合、選入／取消、aria 屬性與樣稿提示。
- 島嶼：勾選同步顯示 SVG、位置編號與文字圖例；全取消時顯示底圖說明；提案預覽另有「尚未實施」文字。
- 故事：播放、2.4 秒自然結束、按鈕略過、Escape、手動減少動態、系統減少動態優先；略過前後故事文字一致。
- 結局 HUD 顯示第五屆，與 05 標題一致。
- 圖片全部載入、無 JavaScript pageerror。
- 原有六黨 `nr / co / tw / ds / fe / gr` 各以 390×844 點擊流程完成五屆，均到達 final、均無 pageerror；反思文字可進入既有 `summaryText()`。
- 19 個 SVG 皆為有效 XML，viewBox／檔案大小與 manifest 一致，無 SVG 內嵌文字，合計 13,754 bytes。
- 截圖：六張 390×844、桌面展示 780×1000，未超過 780px 點陣圖寬度限制。已人工檢視六個手機畫面；新聞標示與結局屆數於獨立審查後修正。

## 重跑方式

測試需要開發環境有 Playwright；遊戲與樣稿本身無依賴。安裝 Playwright 與其 Chromium 後：

```sh
node tests/art_preview_test.cjs
```

若測試使用本機 Edge，PowerShell：

```powershell
$env:ART_BROWSER_CHANNEL = 'msedge'
node tests/art_preview_test.cjs
```

可設 `ART_SHOTS` 指向截圖資料夾。預設不寫入截圖。若 Playwright 在共用 runtime，可用 `NODE_PATH` 指向其 node_modules；不需要新增遊戲相依。

## 未驗證／限制

- 未在實體 iPhone／Android、Safari、螢幕閱讀器或 Claude Artifact 發布環境測試。
- 本次六黨各一局均未破產，不代表破產分支已由本次測試覆蓋；既有 bankruptcy_test.py 未另執行。
- 樣稿固定暖紙色，正式深色模式尚未製作與驗證。
- 七黨遊戲、正式動態元件、持久容器與政策紀錄整合未實作，故沒有驗證其勝率、重播去重或正式資料切換。
- 沒有寄送學生回饋，沒有驗證後端、寄信與資料保存。
- 原 smoke_test.py 的複製成功判斷含 `|| true`，本次未把它當作剪貼簿驗證；本次只驗證 summaryText 含輸入文字，未測試真實剪貼簿。
- Windows 初次 checkout 將 LF 轉 CRLF，會讓 build --check 出現差異；本次在乾淨的新 clone 將相關檔案回到儲存庫 LF 後通過，未提交換行或建置腳本修改。
