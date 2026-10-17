# 福利島新聞台美術 v0.5

## 目的與設計

依老師提供的新聞播報畫面參考，把原本「島嶼插圖＋紅色標頭」改為能辨識的新聞棚：原創主播、播報桌、棚內大螢幕、台標、LIVE 與屆數、大字新聞字幕及島上動態資訊帶。延續遊戲的水粉／粉彩插畫風格。

主播是新創作的虛構人物；圖片沒有真實電視台商標、真實主播臉孔或烘焙在圖片內的新聞文字。螢幕主題取自 `EVENTS.short`，標題取自 `EVENTS.name`，報導與政策影響繼續使用原本的 `d`、`fxt`。資訊帶顯示實際國債、已生效政策數及原有移工投票權提醒。

手機先顯示新聞棚，再顯示輪盤；桌面輪盤在左、新聞棚在右。抽出事件後展開新聞棚。底部動態資訊帶保持可閱讀的靜態文字；LIVE 指示燈支援減少動態設定。

## 素材

- `assets/scenes/newsroom-painted-v1.webp`：1440 × 810、146,428 bytes、不透明。
- 由內建 `imagegen` 生成，原始 PNG 為 1672 × 941；只使用 Sharp 縮放、WebP quality 88 編碼，未描圖或手工重繪。
- 已加入 `ART_FILES()` 預載與 `assets/manifest.json`，未覆寫原有島嶼與人物素材。
- 主要函式：新增 `newsBroadcast(e)`，修改 `rNews()` 的展示組合。原有八個事件、選舉流程、數值與政策規則不變。
- 圖片失敗時，新聞標題、事件、政策影響仍可讀，玩家仍能抽事件與進入編預算；不顯示破圖。

## 內建 imagegen 提示詞（原文）

```text
Use case: illustration-story. Create one production-ready 16:9 landscape illustration for the fictional Taiwanese social-policy game 《誰來照顧誰》. It will become a news television studio scene called 福利島新聞台, with all typography and headlines added later as crisp HTML. Visually unmistakable as a professional television news broadcast set, inspired by the composition of Taiwan news broadcasts but an original fictional set and original fictional anchor. Style: polished hand-painted gouache / soft pastel illustration on subtly textured paper, gentle realistic faces, carefully drawn hands, warm humane editorial picture-book aesthetic, not flat vector graphics, not chibi, not a photo. Composition is important for live web integration: on the LEFT third, an original Taiwanese woman news anchor in her thirties with a neat shoulder-length dark brown bob, wearing an elegant muted coral-pink blazer and cream blouse, small lapel microphone, seated upright looking at the camera, attentive calm professional expression, both hands naturally on a few paper notes on a curved ivory-and-muted-blue news desk. Her head from roughly x=15% to 32%, y=18% to 42%; shoulders/torso down to y=74%. On the RIGHT, a LARGE straight-on rectangular studio video display, inner display rectangle roughly x=43% to 94%, y=18% to 69%, with clean near-horizontal and near-vertical edges so an HTML overlay can fit; its interior is an empty uniform pale cream-blue, absolutely no words, symbols, charts, people, or maps on the display. This blank screen is deliberate functional space, not a blank card placeholder in the scene. Curving architectural panels, vertical frosted teal-blue lights, subdued lavender back wall, studio ceiling lighting and a subtle suggestion of newsroom depth form the actual background. The desk curves across the lower quarter with hand-painted navy, muted teal and cream surfaces, completing the newsroom shot. Professional balanced broadcast camera framing, generous separation between anchor and right-hand display, no giant foreground furniture hiding the anchor. The screen, anchor and desk must be immediately recognizable when reduced to a mobile-width image. Color palette harmonious with existing watercolor/pastel island and realistic gouache resident portraits: sea blues, soft lilac, warm cream, coral accent. No text anywhere, no letters, no Chinese characters, no numbers, no logos, no TVBS branding, no watermark, no lower-third banner baked into the illustration; those will be real HTML UI. High-quality wide 16:9 composition, 1536 by 864 or equivalent.
```

## 驗證

```sh
node --check src/game.js
node build.mjs --check
node tests/newsroom_test.cjs
node tests/student_edition_test.cjs
```

使用既有 Playwright 與 Chromium。`ART_SHOTS` 可指定截圖目錄，`GAME_URL` 可指定部署網址。

- 新聞台測試先在舊版重現「沒有 newsroom broadcast」，接入後通過。
- 360／390／1280px、深色模式、減少動態、全部八種事件文字與政策影響、新聞棚載入失敗時仍能遊玩。
- 七種觀點各完整五屆、破產、政策移除、反思複製備援與既有美術載入回歸測試。
- 截圖檢查主播、大螢幕文字、標題字幕、手機文字不截斷。孤立元件截圖僅隱藏頁面固定頁首／底部操作列，避免它們擋住長元件截圖；正式遊戲保留操作列。
