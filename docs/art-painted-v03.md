# 福利島模型水粉插畫 v0.3

老師已要求「人物請調用模型插畫，不要 SVG」。本次將 v0.2 的兩位人物改成內建 imagegen 生成的水粉／繪本插畫，**使用中的人物素材完全為點陣圖，不以 SVG 或 CSS 畫人物**。島嶼與八類場景物件也採同一模型插畫風格。

## 已交付

| 檔案（相對於 assets/） | 內容 | 尺寸／格數 |
|---|---|---|
| characters/ma-expressions.webp | 秀英阿嬤：開心、平靜、不滿 | 780×260，3 個 260×260 方格 |
| characters/ati-expressions.webp | 阿蒂：開心、平靜、不滿 | 780×260，3 個 260×260 方格 |
| scenes/island-painted.webp | 無建物水粉島嶼，供後續疊圖 | 780×430 |
| scenes/services-painted.webp | 照顧、交通、住宅、能源、社區、醫療、學校、產業 | 780×390，4 欄 2 列，每格 195×195 |

保留兩位人物的年齡、服裝與既有辨識特徵。中性表情不誇張，不用流淚、汗滴、邪惡表情代表政策負面影響。阿蒂的頭巾沿用此角色設定，不推論全部移工的宗教或穿著。

**舊六張 SVG 人物已移除，manifest 不再列入。** 原先的九張向量場景保留為舊版參考，不在新版樣稿中使用；四個簡單介面圖示仍是 SVG，與人物插畫分開。

## 預覽

開啟 `src/art-preview.html`，切換「角色樣張」「島嶼新聞」「第三屆故事」。其他畫面共用人物與島嶼，已同步換用新素材。

- [人物手機截圖](screenshots/art-v03/characters-390.png)
- [島嶼手機截圖](screenshots/art-v03/news-390.png)
- [故事手機截圖](screenshots/art-v03/story-390.png)

所有人物說明、政策文字、地圖編號與標籤都是 HTML。插畫中不包含教學文字。樣稿尚未接入正式遊戲、未合併 main，不代表學生已能玩到美術改版。

## Claude 整合方式

人物採**圖集**，不必請模型重繪六張獨立圖。以正方形容器 `overflow:hidden`，內部 `img` 寬度 300%、高度 100%；三種表情的 img 平移量依序為 `0% / -33.333333% / -66.666667%`（相對於圖集本身）。`src/art-preview.js` 的 `portrait()` 與 CSS `.painted-portrait` 提供已驗證示例。

- 建議實際顯示 68px 或 100px，單格原圖 260px 足供手機顯示。
- 人物動畫加在外層容器，不能覆蓋內部 img 選取表情的 transform。
- 使用 `role=img` 與具角色／表情意義的 aria-label，圖集內部 img 的 alt 留空，避免重複朗讀。
- 原版 `neutral → flat`、`upset → sad` 的語義映射不變。
- 外部 WebP 路徑必須隨 Artifact 一起發布，或由 build 內嵌；仍須 Claude 驗證實際 Artifact 載入。
- 新版圖集 id 與舊 SVG 路徑不同，不能直接套用 v0.2 的檔名；以最新 manifest 為準。

場景圖集使用 4×2 網格，CSS 寬 400%、高 200%，x 每欄移動 25%、y 每列移動 50%。按 manifest 的 order 對應分類。島上位置依 `src/art-preview.js` 的 objects 表；編號與圖例同步，不能任意更換 atlas 格序。

圖集仍只代表服務領域，不代表已實施、政府所有權或政策成效。無對應來源的政策不要硬套建物；制度型政策用文字。遊戲邏輯、政策資料、七觀點改版與正式動畫模組仍由 Claude 處理，見 [Issue #6](https://github.com/paulchen01/welfare-island-election/issues/6)。

## 製作與檔案處理

- 使用內建 imagegen；沒有 SVG 描圖、沒有手寫人物輪廓、沒有調用 CLI／API fallback。
- 精確提示詞見 [art-prompts-v03.md](art-prompts-v03.md)。參考圖只用於既有角色身份與本次水粉材質一致性。
- 原始 PNG 保留在交付包 `originals/`；遊戲交付檔僅縮放及編碼為 WebP，未做重繪、換臉、去背修補或改色。
- 原圖人物、物件皆有 alpha；WebP 保留透明背景。因手機規格將圖集寬度輸出為 780px，島嶼輸出為 780×430。
- 試製範圍仍是兩位人物。其餘九位人物尚未生成，正式遊戲中的舊人物函式也尚未替換。

## 驗證

`tests/art_preview_test.cjs` 覆蓋新版樣稿、表情圖集載入、360／390／1280px 排版、島嶼圖層與圖例同步、動畫略過／減少動態及原六黨五屆流程。另檢查 WebP 尺寸、alpha 與 manifest 檔案大小。正式手機硬體、深色模式與 Artifact 發布仍待驗證。
