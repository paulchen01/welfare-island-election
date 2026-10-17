# 棚內事件轉盤 v0.6

老師確認採用「棚內道具」方向。轉盤改為奶油白外框、霧金細邊、珊瑚紅指針與新聞台底座，沿用遊戲的照顧四葉徽章。八種事件以原創水粉圖集呈現，所有文字仍由程式顯示。

## 素材與整合

- `assets/scenes/events-painted-v1.webp`：1600 × 800、334,486 bytes、透明 WebP，4 欄 × 2 列，每格 400 × 400。
- 格序依 `EVENTS`：少子化、經濟衰退、疫情、AI 失業潮、颱風、超高齡、油價上漲、景氣繁榮。
- 內建 imagegen 生成原始透明 PNG（1774 × 887），Sharp 僅等比例縮放與 WebP quality 90／alphaQuality 100 編碼。原圖保留在生成位置，未人工重繪。
- `wheelSVG()` 更新轉盤外觀與圖集裁切；新增 `wheelProp()` 組合底座、播報狀態及本地操作鈕；`rNews()` 接入。
- `spin()` 保留原本等機率、五屆不重複的事件池及數值。轉盤和符號等速反向旋轉，使圖示、事件名稱維持正向。停下 850ms 顯示選中扇區和事件名，再切入原有新聞播報。
- 兩個抽選操作鈕共用同一個動作，轉動期間都停用，並防止重入。手機從固定操作列啟動時會捲到轉盤，完成後回到新聞；減少動態設定略過旋轉與揭曉延遲。
- 已抽過事件淡化並蓋「已播報」章。圖集讀取失敗時保留編號、名稱與完整抽選流程。
- 小於 960px 使用直向配置；桌面為轉盤在左、主播在右。深色模式保留實體道具的奶油白外框。

## 內建 imagegen 完整提示詞

```text
Use case: illustration-story. Create a production-ready transparent sprite atlas of EIGHT small editorial gouache illustrations for a fictional Taiwanese social-policy game, to decorate a pastel television-studio event wheel. Exactly FOUR equally wide columns by TWO equally high rows, a wide 2:1 image. Each cell contains one separate centered icon with equal generous padding, every illustration contained within the middle 65 percent of its own cell. No grid lines, no cell backgrounds, no lettering, no words, no digits, no logos. Preserve real transparent background everywhere outside the painted objects. These are warm, carefully painted miniature physical objects with delicate paper texture inside the pigment, softly modeled volume and soft edges, sophisticated humane picture-book style matching a hand-painted pastel news studio. Readable simple silhouettes at 48px, no busy micro-details. Palette of sea blue, muted teal, warm ivory, soft lavender, coral and ochre. No emoji or vector appearance. Exact cell order, left to right: TOP row 1) an empty cream and coral baby pram, symbol of low birth rate; 2) a small group of muted blue economic bar-chart blocks with a coral downward-curving arrow, economic recession; 3) a folded pale teal surgical face mask with ear loops, pandemic; 4) a cream desktop computer screen containing a simple teal circuit pattern, a small closed briefcase beside it, AI changing jobs. BOTTOM row 1) a gently bending palm tree next to a curling blue-gray storm cloud, typhoon; 2) a pair of gold-rim reading spectacles resting on a closed lavender book beside a slim wooden walking cane, ageing population, dignified ordinary objects; 3) a small coral-and-ivory petrol pump with black hose and one small golden oil drop, rising oil prices; 4) a group of sea-blue economic bar-chart blocks with a gold upward-curving arrow, economic growth. Keep all eight objects separate, uniformly sized and centered in their precise 4 by 2 cells. No people, no faces, no frame, no cast shadows outside the illustration padding. Landscape atlas with genuine alpha transparency.
```

## 驗證

`tests/wheel_test.cjs` 先在舊版確認缺少道具上的抽選控制，再接入實作。涵蓋一般動畫的指針位置、揭曉停留與播報一致、兩個按鈕鎖定；360／390／768／1280px、深色、減少動態；各尺寸連抽八次不重複及已播報標示；缺圖仍可進入預算。

另執行新聞棚測試、七觀點各完整五屆回歸、`node --check src/game.js` 及 `node build.mjs --check`。截圖另行檢視初始、已播報、手機、桌面與深色外觀。測試可用 `GAME_URL` 指向正式站、`ART_SHOTS` 指定截圖目錄。
