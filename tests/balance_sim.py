"""平衡模擬：每個觀點自動玩 N 局，統計勝率（Playwright, Python）

用法：python3 tests/balance_sim.py [html 檔，預設 index.html] [--n 每個觀點局數，預設 12]

玩家策略（模擬「很會算票」的學生）：
- 每屆試低、中、高三種稅率，逐張加入最能提高自己得票率的卡，最多 4 張；赤字不超過 2。
- 質詢回答第一個選項；公投支持、不花宣傳費；制度改革照預設；其餘照預設按鈕。
輸出每個觀點的：最終第 1 名比例、平均執政屆數、平均名次。
這是比較用的粗估，不代表真實學生的勝率。
"""
import sys, json, pathlib, statistics
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
args = [a for a in sys.argv[1:]]
N = int(args[args.index('--n') + 1]) if '--n' in args else 12
pos = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--n')]
target = pathlib.Path(pos[0]).resolve() if pos else here.parent / 'index.html'
PARTIES = ['sd', 'nr', 'tw', 'mx', 'fe', 'ns', 'gr']

PICK = """() => {const k=key(ME),pl=S.platforms[ME];
  // 貪婪策略：試三種稅率，每次加入最能提高自己得票率的卡，最多 MAXADD 張、赤字不超過 2
  const avail=S.hand.filter(id=>P[id]&&!S.enacted.some(x=>x.id===id)&&!S.onceUsed.includes(id));
  let best=null;
  for(const tax of ['低','中','高']){pl.tax=tax;pl.add=[];
    let cur=votes().pct[ME];
    while(pl.add.length<MAXADD){let pick=null,pv=cur;
      for(const id of avail){if(pl.add.includes(id))continue;pl.add.push(id);
        if(money(ME).bal>=-2){const v=votes().pct[ME];if(v>pv+0.05){pv=v;pick=id}}pl.add.pop()}
      if(!pick)break;pl.add.push(pick);cur=pv}
    if(!best||cur>best.v)best={v:cur,tax,add:pl.add.slice()}}
  pl.tax=best.tax;pl.add=best.add;
  if(!pl.add.length&&avail.length)pl.add=[avail.slice().sort((a,b)=>costOf(a,k)-costOf(b,k))[0]];}"""

def click(page, sel):
    page.evaluate(f"(()=>{{const e=document.querySelector('{sel}');if(e)e.click();return !!e}})()")

def has(page, sel):
    return page.evaluate(f"!!document.querySelector('{sel}')")

out = {}
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe) if pathlib.Path(exe).exists() else p.chromium.launch()
    page = b.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    for party in PARTIES:
        firsts, govs, ranks = 0, [], []
        for g in range(N):
            page.goto(target.as_uri())
            page.wait_for_function('typeof S!=="undefined"&&S.phase==="title"')
            click(page, '[data-a=totitle]')
            page.evaluate(f"goCar(document.getElementById('scar'),PK.indexOf('{party}'),false)")
            page.wait_for_timeout(50)
            if page.evaluate('S.choice') != party:  # 滑動選單偶爾未更新選擇，模擬時直接設定
                page.evaluate(f"S.choice='{party}';render()")
            click(page, '[data-a=start]')
            guard = 0
            while page.evaluate('S.phase') != 'final' and guard < 120:
                guard += 1
                ph = page.evaluate('S.phase')
                if ph == 'news':
                    if has(page, '#spinbtn'):
                        click(page, '#spinbtn'); page.wait_for_function('S.event!==null')
                    if has(page, '[data-a=cq]'): click(page, '[data-a=cq]')
                    click(page, '[data-a=tobudget]')
                elif ph == 'reform':
                    click(page, '[data-a=reformdone]')
                elif ph == 'ref':
                    if has(page, '[data-a=refvote]'):
                        click(page, '[data-a=stance][data-v=yes]'); click(page, '[data-a=refvote]')
                    click(page, '[data-a=refdone]')
                elif ph == 'demo':
                    click(page, '[data-a=demook]')
                elif ph == 'budget':
                    page.evaluate(PICK); page.evaluate('render()')
                    click(page, '[data-a=count]')
                elif ph == 'results':
                    click(page, '[data-a=answer][data-i="0"]')
                    for _ in range(3): click(page, '[data-a=rnext]')
                    click(page, '[data-a=confirm]')
                elif ph == 'imf':
                    click(page, '[data-a=tofinal]')
                else:
                    break
            r = page.evaluate('(()=>{const sc=scores(),rank=[...sc].sort((a,b)=>b.total-a.total).findIndex(s=>s.g===ME)+1;return {rank,gov:sc[ME].gov,phase:S.phase}})()')
            if r['phase'] != 'final': errs.append(f'{party} game {g} stuck at {r["phase"]}')
            ranks.append(r['rank']); govs.append(r['gov']); firsts += r['rank'] == 1
        out[party] = {'first%': round(firsts / N * 100), 'avgGov': round(statistics.mean(govs), 2), 'avgRank': round(statistics.mean(ranks), 2)}
        print(party, out[party], flush=True)
    b.close()
print(json.dumps({'n': N, 'result': out, 'errors': errs[:5]}, ensure_ascii=False))
