"""破產（IMF）分支測試：在第 1 屆開票前把國債調高到 60（扣掉本屆結餘後仍超過紅線 18），確認會進入 imf 畫面再到結局。"""
import sys, pathlib
from playwright.sync_api import sync_playwright
target = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else pathlib.Path(__file__).parent.parent/'index.html').resolve()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce'); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(target.as_uri()); pg.wait_for_function('typeof S!=="undefined"')
    for s in ['[data-a=totitle]','[data-a=choose][data-k=ds]','[data-a=start]','#spinbtn']: pg.locator(s).first.click()
    pg.wait_for_function('S.event!==null'); pg.locator('[data-a=tobudget]').click()
    pg.locator('[data-a=count]').click(); pg.locator('[data-a=answer][data-i="0"]').click()
    pg.evaluate('S.debt=60'); pg.locator('[data-a=confirm]').click()
    a=pg.evaluate('S.phase'); pg.locator('[data-a=tofinal]').click(); c=pg.evaluate('S.phase')
    print('after confirm:',a,'| after button:',c,'| bankrupt:',pg.evaluate('S.bankrupt'),'| errors:',errs)
    sys.exit(0 if (a,c)==('imf','final') and not errs else 1)
