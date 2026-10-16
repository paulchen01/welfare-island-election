# 福利島大選

社會政策與立法課程用的單人策略遊戲。學生帶領一個政黨參選五屆，用有限預算照顧 11 位島民，最後揭曉全島變成哪一種福利體制。手機可玩，約 20 分鐘。

## 試玩

- 線上：啟用 GitHub Pages 後，網址為 `https://paulchen01.github.io/welfare-island-election/`
- 本機：直接用瀏覽器開啟 `index.html`

## 開發

只改 `src/` 內的檔案，再執行：

```
node build.mjs
```

會重新產生 `index.html`（GitHub Pages）與 `artifact/welfare-island.html`（Claude Artifact）。

## 測試

```
pip install playwright && playwright install chromium
python3 tests/smoke_test.py
python3 tests/bankruptcy_test.py
```

## 協作

由 Claude 與 Codex 透過 GitHub 協作開發：

- 規則：[`AGENTS.md`](AGENTS.md)
- 目前進度與交接：[`HANDOFF.md`](HANDOFF.md)
- 遊戲架構與現況：[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 美術規格：[`docs/ART_SPEC.md`](docs/ART_SPEC.md)（Codex）；整合需求：[`docs/ART_INTEGRATION.md`](docs/ART_INTEGRATION.md)（Claude）
- 兩邊往來與老師決定：[`docs/collab/`](docs/collab/)
- 工作分派：GitHub issues，標籤 `for-claude`、`for-codex`

## 資料夾

| 路徑 | 內容 |
|---|---|
| `src/` | 可編輯的原始碼 |
| `index.html` | 建置產出，GitHub Pages 發布 |
| `artifact/` | 建置產出，Claude Artifact 發布用 |
| `assets/` | 美術素材與 `manifest.json` |
| `docs/` | 設計與規格文件、往來紀錄、資料初稿、參考截圖 |
| `tests/` | 瀏覽器自動測試（Playwright） |
| `original/` | 協作前的原始發布檔，只讀保存 |
