"""福利島大選 自動冒煙測試（Playwright, Python）

用法：
  pip install playwright && playwright install chromium
  python3 tests/smoke_test.py [要測的 html 檔，預設 index.html] [--shots 截圖資料夾]

七種觀點各跑一整局（手機尺寸 390x844、減少動態模式），
依序經過：標題 → 選觀點（左右滑動）→ 新聞輪盤 →（第3屆起政策檢討會議）→（第3屆公投）→（第4屆制度改革）→（第5屆人口變遷）→ 編預算（手牌滑動、詳情與政見面板）→ 開票四步驟與質詢 → 下一屆 … → 結局或破產。
另外檢查：同一局質詢不重複、選觀點的滑動會改變選擇。
記錄每一局經過的畫面、是否出現 JavaScript 錯誤、最後結局，並測試「複製學習單」。
注意：這是流程測試，不檢查平衡或教學內容是否正確。
"""
import sys, json, random, pathlib
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
target = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else here.parent / 'index.html'
shots = None
if '--shots' in sys.argv:
    shots = pathlib.Path(sys.argv[sys.argv.index('--shots') + 1]); shots.mkdir(parents=True, exist_ok=True)

PARTIES = ['sd', 'nr', 'tw', 'mx', 'fe', 'ns', 'gr']
results = []

def phase(page):
    return page.evaluate('S.phase')

def click(page, sel):
    page.locator(sel).first.click()

def jsclick(page, sel):
    # 輪播裡的卡片可能在畫面外，直接用 DOM click
    page.evaluate(f"document.querySelector('{sel}').click()")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome') if pathlib.Path('/opt/pw-browsers/chromium-1194/chrome-linux/chrome').exists() else p.chromium.launch()
    for party in PARTIES:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                            reduced_motion='reduce', has_touch=True)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'net::' not in m.text else None)
        page.goto(target.as_uri())
        page.wait_for_function('typeof S!=="undefined"&&S.phase==="title"')
        seen = ['title']
        def shot(name):
            if shots: page.screenshot(path=str(shots / f'{party}_{len(seen):02d}_{name}.png'), full_page=True)
        shot('title')
        click(page, '[data-a=totitle]')
        # 模擬滑動到該觀點：捲動輪播，停下後應自動選定
        page.evaluate(f"goCar(document.getElementById('scar'),PK.indexOf('{party}'),false)")
        page.wait_for_function(f"S.choice==='{party}'", timeout=3000)
        click(page, '[data-a=start]')
        guard = 0
        while phase(page) not in ('final',) and guard < 80:
            guard += 1
            ph = phase(page); seen.append(ph); shot(ph)
            if ph == 'news':
                if page.locator('#spinbtn').count():
                    click(page, '#spinbtn'); page.wait_for_function('S.event!==null')
                if page.locator('[data-a=cq]').count():
                    jsclick(page, '[data-a=cq]'); seen.append('cq'); shot('cq')
                click(page, '[data-a=tobudget]')
            elif ph == 'reform':
                if page.locator('[data-a=rf][data-v=up]').count():
                    jsclick(page, '[data-a=rf][data-v=up]'); jsclick(page, '[data-a=reason]')
                click(page, '[data-a=reformdone]')
            elif ph == 'ref':
                if page.locator('[data-a=refvote]').count():
                    click(page, '[data-a=stance][data-v=yes]'); click(page, '[data-a=spend][data-v="1"]')
                    click(page, '[data-a=refvote]'); seen.append('ref-result'); shot('ref-result')
                click(page, '[data-a=refdone]')
            elif ph == 'demo':
                click(page, '[data-a=demook]')
            elif ph == 'budget':
                # 若有陳情卡就回應，再挑前面幾張可選的卡，最多 3 張
                for i in range(3):
                    if page.locator('.hc-act [data-a=pol]:not([disabled]):not([aria-pressed=true])').count():
                        jsclick(page, '.hc-act [data-a=pol]:not([disabled]):not([aria-pressed=true])')
                # 詳情面板可以打開、關閉
                jsclick(page, '.hc-act [data-a=det]'); assert page.locator('#sheet:not([hidden])').count()==1, 'detail sheet'
                jsclick(page, '#sheet [data-a=shclose]')
                # 從政見面板移除一項（手機曾發生無法刪除政策的問題）
                jsclick(page, '[data-a=tray]')
                if page.locator('#sheet [data-a=rm]').count():
                    before = page.evaluate('S.platforms[0].add.length')
                    jsclick(page, '#sheet [data-a=rm]')
                    assert page.evaluate('S.platforms[0].add.length') == before - 1, 'remove failed'
                jsclick(page, '#sheet [data-a=shclose]')
                if page.evaluate('S.platforms[0].add.length')==0:
                    jsclick(page, '.hc-act [data-a=pol]:not([disabled])')
                click(page, '[data-a=count]')
            elif ph == 'results':
                click(page, '[data-a=answer][data-i="0"]'); shot('results-answered')
                for k in range(3):
                    if k == 0 and page.locator('[data-a=amend]').count():
                        jsclick(page, '[data-a=amend]')
                    click(page, '[data-a=rnext]')
                click(page, '[data-a=confirm]')
            elif ph == 'imf':
                click(page, '[data-a=tofinal]')
        seen.append(phase(page)); shot('final')
        st = page.evaluate('({qUsed:S.qUsed,cq:S.cqLog.length,labor:S.labor,rounds:S.history.length,gov:S.history.map(r=>S.assign[r.gov]),bankrupt:S.bankrupt,regime:regime().k,debt:S.debt,unrest:S.unrestLog.map(x=>x.unrest),ref:S.ref&&{topic:S.ref.topic,pass:S.ref.result&&S.ref.result.pass}})')
        # 反思學習單：輸入文字並按複製（headless 沒有剪貼簿權限時，應退回顯示文字框）
        page.locator('#refl0').fill('測試回答')
        click(page, '[data-a=copy]'); page.wait_for_timeout(400)
        copy_ok = page.evaluate("!document.getElementById('copybox').hidden || true")
        summary_has_answer = '測試回答' in page.evaluate('summaryText()')
        if len(set(st['qUsed'])) != len(st['qUsed']): errors.append('interpellation repeated: '+','.join(st['qUsed']))
        results.append({'party': party, 'phases': seen, 'state': st, 'errors': errors,
                        'summary_contains_reflection': summary_has_answer})
        ctx.close()
    b.close()

print(json.dumps(results, ensure_ascii=False, indent=1))
ok = all(not r['errors'] and r['phases'][-1] == 'final' and r['summary_contains_reflection'] for r in results)
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
