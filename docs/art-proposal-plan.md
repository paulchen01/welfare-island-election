# Issue #2 樣稿製作計畫

依據：AGENTS.md、docs/collab/TO_CODEX_decisions_v01.md 與 TO_CODEX_review_v01.md。已確認方向延續；本次交付設計提案，尚未將樣稿接入正式遊戲。

- [x] 原創 SVG：兩位角色各三種表情，分層島嶼、政策圖示；所有文字另用 HTML。
- [x] src/art-preview.html、art-preview.css、art-preview.js：390px 手機預算／開票／結局稿，加新聞場景、角色表情表與第三屆動畫展示。無外部相依。
- [x] docs/art-proposal.md：視覺方向、七觀點色票、真實函式對照、資料契約、動畫時間表與整合範圍。
- [x] 以 360／390／桌面及放大字體檢查溢位；測試按鈕、跳過、減少動態、缺值；執行既有五屆流程驗證。
- [x] assets/manifest.json 登記尺寸、錨點、版本、角色／圖層識別；更新 HANDOFF、CHANGELOG。
- [x] 從 codex/art-proposal 開 [PR #7](https://github.com/paulchen01/welfare-island-election/pull/7)，另建 [for-claude 整合 Issue #6](https://github.com/paulchen01/welfare-island-election/issues/6)，由老師決定合併。

範圍界線：不改政策數值、不採用未審核的 policy_meta、不將任何觀點視為最佳解、不改 main 或既有遊戲輸出。原始遊戲建置與語法檢查必須仍通過。
