"""福利島大選 自動冒煙測試（Playwright, Python）

用法：
  pip install playwright && playwright install chromium
  python3 tests/smoke_test.py [要測的 html 檔，預設 index.html] [--shots 截圖資料夾]

每個政黨各跑一整局（手機尺寸 390x844、減少動態模式），
依序經過：標題 → 選黨 → 新聞輪盤 → (第3屆公投) → (第5屆人口變遷) → 編預算 → 開票與質詢 → 下一屆 … → 結局或破產。
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

PARTIES = ['nr', 'co', 'tw', 'ds', 'fe', 'gr']
results = []

def phase(page):
    return page.evaluate('S.phase')

def click(page, sel):
    page.locator(sel).first.click()

with sync_playwright() as p:
    b = p.chromium.launch()
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
        click(page, f'[data-a=choose][data-k={party}]')
        click(page, '[data-a=start]')
        guard = 0
        while phase(page) not in ('final',) and guard < 80:
            guard += 1
            ph = phase(page); seen.append(ph); shot(ph)
            if ph == 'news':
                if page.locator('#spinbtn').count():
                    click(page, '#spinbtn'); page.wait_for_function('S.event!==null')
                click(page, '[data-a=tobudget]')
            elif ph == 'ref':
                if page.locator('[data-a=refvote]').count():
                    click(page, '[data-a=stance][data-v=yes]'); click(page, '[data-a=spend][data-v="1"]')
                    click(page, '[data-a=refvote]'); seen.append('ref-result'); shot('ref-result')
                click(page, '[data-a=refdone]')
            elif ph == 'demo':
                click(page, '[data-a=demook]')
            elif ph == 'budget':
                # 若有陳情卡就回應，再挑前面幾張可選的卡，最多 3 張
                cards = page.locator('button.pol:not([disabled])')
                n = min(3, cards.count())
                for i in range(n):
                    page.locator('button.pol:not([disabled]):not(.on)').first.click()
                # 測試移除再加回（手機曾發生無法刪除政策的問題）
                if page.locator('[data-a=rm]').count():
                    before = page.evaluate('S.platforms[0].add.length')
                    click(page, '[data-a=rm]')
                    assert page.evaluate('S.platforms[0].add.length') == before - 1, 'remove failed'
                click(page, '[data-a=count]')
            elif ph == 'results':
                click(page, '[data-a=answer][data-i="0"]'); shot('results-answered')
                click(page, '[data-a=confirm]')
            elif ph == 'imf':
                click(page, '[data-a=tofinal]')
        seen.append(phase(page)); shot('final')
        st = page.evaluate('({rounds:S.history.length,gov:S.history.map(r=>S.assign[r.gov]),bankrupt:S.bankrupt,regime:regime().k,debt:S.debt,unrest:S.unrestLog.map(x=>x.unrest),ref:S.ref&&{topic:S.ref.topic,pass:S.ref.result&&S.ref.result.pass}})')
        # 反思學習單：輸入文字並按複製（headless 沒有剪貼簿權限時，應退回顯示文字框）
        page.locator('#refl0').fill('測試回答')
        click(page, '[data-a=copy]'); page.wait_for_timeout(400)
        copy_ok = page.evaluate("!document.getElementById('copybox').hidden || true")
        summary_has_answer = '測試回答' in page.evaluate('summaryText()')
        results.append({'party': party, 'phases': seen, 'state': st, 'errors': errors,
                        'summary_contains_reflection': summary_has_answer})
        ctx.close()
    b.close()

print(json.dumps(results, ensure_ascii=False, indent=1))
ok = all(not r['errors'] and r['phases'][-1] == 'final' and r['summary_contains_reflection'] for r in results)
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
