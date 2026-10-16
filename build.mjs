// 福利島大選 build script
// 用法：node build.mjs          產生 index.html 與 artifact/welfare-island.html
//       node build.mjs --check  只檢查產出檔是否與 src/ 一致（CI 使用），不寫檔
//
// 讀取 src/ 下的 styles.css、game.js、body.html，產生：
//   index.html                    一般瀏覽器版，GitHub Pages 直接發布這個檔
//   artifact/welfare-island.html  Claude Artifact 發布用（不含 doctype/head，發布時會自動加上外框）
// 兩者的 CSS、JS、HTML 標記完全相同，只有外框不同。
// 請只修改 src/，不要手動改 index.html 或 artifact/。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

const css = read('src/styles.css');
const js = read('src/game.js');
const body = read('src/body.html');

// Artifact is distributed as one HTML fragment; embed only the raster assets used by game.js.
const artFiles = JSON.parse(read('assets/manifest.json')).assets
  .filter(a => a.file.startsWith('characters/') || a.file.startsWith('scenes/news/'));
const embeddedArt = Object.fromEntries(artFiles.map(a => [a.file,
  `data:image/webp;base64,${readFileSync(join(root, 'assets', a.file)).toString('base64')}`]));
const artifactJS = js.replace('const ART_EMBEDDED = null;', `const ART_EMBEDDED = ${JSON.stringify(embeddedArt)};`);

const FONTS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&family=Noto+Sans+TC:wght@400;500;700;900&family=IBM+Plex+Mono:wght@500;600&display=swap';

const artifact =
`<title>福利島大選</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONTS}">
<style>
${css}</style>

${body}<script>
${artifactJS}</script>
`;

const browser =
`<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>福利島大選</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONTS}">
<style>
/* 以下 reset 取自 Claude Artifact 發布外框，讓一般瀏覽器版與 Artifact 版排版一致 */
:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}
img{max-width:100%}
[hidden]:not([hidden=until-found i]){display:none!important}
</style>
<style>
${css}</style>
</head>
<body>
${body}
<script>
${js}</script>
</body>
</html>
`;

const outputs = { 'index.html': browser, 'artifact/welfare-island.html': artifact };

if (process.argv.includes('--check')) {
  const stale = Object.entries(outputs).filter(([p, c]) => !existsSync(join(root, p)) || read(p) !== c).map(([p]) => p);
  if (stale.length) {
    console.error('以下檔案與 src/ 不一致，請執行 node build.mjs 後再 commit：\n  ' + stale.join('\n  '));
    process.exit(1);
  }
  console.log('OK：產出檔與 src/ 一致');
} else {
  for (const [p, c] of Object.entries(outputs)) writeFileSync(join(root, p), c);
  console.log('已產生 index.html、artifact/welfare-island.html');
}
