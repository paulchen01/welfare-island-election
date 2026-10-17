"""把 docs/data/policy_meta_v0.2.json 嵌入 src/game.js 的 META 區塊。

用法：python3 docs/data/embed_policy_meta.py && node build.mjs

遊戲是單一 HTML、不讀外部檔，所以資料以 JS 常數嵌入。
只嵌入介面要顯示的欄位：誰提供、誰負擔、服務對象、預期改善、需要考量、相關觀點與理由。
政策資料以 JSON 為唯一來源；改資料請改 JSON 再重跑本腳本，不要手改 game.js 的 META 區塊。
"""
import json, pathlib, re

root = pathlib.Path(__file__).resolve().parents[2]
src = root / 'src' / 'game.js'
data = json.loads((root / 'docs' / 'data' / 'policy_meta_v0.2.json').read_text(encoding='utf8'))
STANCE = {'支持': 'up', '保留': 'mid', '批評': 'dn'}

rows = {}
for x in data:
    rows[x['id']] = {
        'pv': x['roles']['provider'], 'py': x['roles']['payer'], 'tg': x['roles']['target'],
        'gain': x['expect']['gain'], 'risk': x['expect']['concern'],
        'vw': [[v['view'], STANCE[v['stance']], v['why']] for v in x['views']],
    }
body = ',\n'.join(f" {k}:{json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for k, v in rows.items())
block = ("// ---------- META：政策責任與觀點資料（由 docs/data/embed_policy_meta.py 產生，來源 policy_meta_v0.2.json，請勿手改）----------\n"
         "const META={\n" + body + "\n};\n// ---------- END META ----------\n")

s = src.read_text(encoding='utf8')
pat = re.compile(r"// ---------- META：.*?// ---------- END META ----------\n", re.S)
if pat.search(s):
    s = pat.sub(lambda m: block, s)
else:
    anchor = "POL.push(...EVPOL,...PETS.map(t=>t.card));\n"
    assert anchor in s, 'anchor not found'
    s = s.replace(anchor, anchor + block, 1)
src.write_text(s, encoding='utf8')
print('embedded', len(rows), 'policies')
