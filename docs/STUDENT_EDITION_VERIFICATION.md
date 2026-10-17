# 學生正式版驗證 · 2026-10-17

來源為老師確認的 `claude/combine-all`（`4faee894befab15e6f5ccc51067980b936237797`）。原公開 main 為 `382a9a3373d6e4c6ff0dda927636fece35e09040`。本次恢復粉彩人物顯示，並將舊新聞／公投／人口變遷地圖接上既有粉彩底圖。

## 可重跑檢查

有既有 Node.js Playwright 與 Chromium 的環境可執行：

```sh
node --check src/game.js
node build.mjs --check
node tests/student_edition_test.cjs
```

可用 `ART_SHOTS` 指定截圖與 JSON 測試結果目錄；`GAME_URL` 指定公開網址；`ART_ONLY=1` 只跑版面／美術／缺圖備援。測試不替使用者安裝套件。Windows 若啟用 Git 自動轉換 CRLF，建置前請先確認工作副本換行與 repository 的 LF 一致。

## 結果

| 檢查 | 結果 |
|---|---|
| 七觀點流程 | 每種觀點各五屆，共 35 屆，全部到達正常結局 |
| 第三屆公投、第四屆制度改革、第五屆人口變遷 | 七局皆經過 |
| 詳情中的政策資料、政見移除、開票四步、質詢不重複 | 通過 |
| 破產與 IMF 分支 | 到達破產畫面及結局 |
| 反思文字與無剪貼簿權限時的文字框備援 | 保留實際輸入的內容 |
| 人物與地圖 | 13 張 WebP 載入；11 人 × 3 表情與 11 個場景鍵使用粉彩素材 |
| 素材全部失敗 | 無破圖，既有 SVG 備援可進入遊戲 |
| 首頁版面 | 360、390、1280px 無整頁橫向溢出；390px 深色模式正常 |
| JavaScript 錯誤 | 0 |
| 建置產出與原始碼 | 一致 |

人物測試先在原整合版失敗（`all 11 characters and 33 expressions use painted art`），修復 `face()` 後通過。場景測試先在舊新聞地圖失敗（`news, referendum and demographics all use painted island`），接入 `paintedLandscape()` 後通過。

已檢視手機與桌面首頁、新聞、政策詳情、公投、人口變遷及結局截圖。這是 Chromium 的可重現流程與畫面測試，不是學生實機研究、遊戲平衡模擬或教學內容審查；理論資料與基本盤分數的既有差異見 `HANDOFF.md`。
