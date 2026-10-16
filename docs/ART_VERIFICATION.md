# 美術樣稿 v0.2 驗證紀錄

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
