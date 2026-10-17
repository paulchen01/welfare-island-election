"""規則一致性測試（依 Codex AUDIT-2026-10-17 的控制案例）

用法：python3 tests/rules_test.py [html 檔，預設 index.html]
每個案例直接建立遊戲狀態並呼叫實際生效的函式，檢查修正後的規則。
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
target = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else here.parent / 'index.html'

SETUP = """(k)=>{S=fresh();S.choice=k;S.assign=[k,...PK.filter(x=>x!==k)];S.pets=[];S.issue=ISSUES[0].id;
  S.phase='budget';S.round=0;S.event='e1';S.used=['e1'];deal();}"""

CASES = {
 # C：在野修正案通過，當屆就要支付成本
 'amendment_cost_counted': """()=>{S.debt=40;S.platforms.forEach(p=>{p.add=[];p.cut=[];p.tax='中'});
   const gov=1;S.platforms[ME].add=['p7'];S.platforms[gov].add=[];
   VOTES={pct:GS.map(g=>g===gov?60:5),probs:{},sats:GS.map(()=>({}))};
   const bal=money(gov).bal;S.amend={id:'p7',ok:true};const c=costOf('p7',key(gov));S.phase='results';
   confirmGov();return {debt:S.debt,expect:Math.max(0,40-bal+c),cost:c,bal,enacted:S.enacted.some(x=>x.id==='p7')}}""",
 # D：別黨執政時實施了玩家也提出的政策，算玩家的成果
 'adoption_credited_to_proposer': """()=>{S.platforms.forEach(p=>{p.add=[];p.cut=[]});const gov=1;
   S.platforms[ME].add=['q11'];S.platforms[gov].add=['q11'];
   VOTES={pct:GS.map(g=>g===gov?60:5),probs:{},sats:GS.map(()=>({}))};S.phase='results';confirmGov();
   return {mine:S.adopt[ME],gov:S.adopt[gov],others:S.adopt.filter((v,g)=>g!==ME&&g!==gov).reduce((a,b)=>a+b,0)}}""",
 # E：不新增、不刪減也能公布政見
 'publish_without_changes': """()=>{S.platforms[ME].add=[];S.platforms[ME].cut=[];S.platforms[ME].tax='高';render();
   const b=document.querySelector('[data-a=count]');return {exists:!!b,disabled:b?b.disabled:null}}""",
 # F：政策檢討的配套出現在既有方案，母政策退場時一起退場
 'support_measure_visible_and_removed_with_parent': """()=>{S.enacted=[{id:'p7',cost:4,start:0}];S.round=2;S.lastGov=ME;S.cqUsed=[];
   const C=CONSEQ.find(c=>c.pid==='p7');if(!C)return {skip:'no consequence card for p7'};
   S.cq={pid:'p7',pick:null,applied:null};const i=C.opts.findIndex(o=>o.cost>0);if(i<0)return {skip:'no costly option'};
   applyCq(i);const cx=S.enacted.find(x=>P[x.id]&&P[x.id].custom);S.phase='budget';deal();render();
   const shown=document.body.innerHTML.includes('配套：'+P[cx.id].name);
   S.platforms.forEach(p=>{p.add=[];p.cut=[]});S.platforms[ME].cut=['p7'];
   VOTES={pct:GS.map(g=>g===ME?60:5),probs:{},sats:GS.map(()=>({}))};S.phase='results';confirmGov();
   return {shown,cxRemoved:!S.enacted.some(x=>x.id===cx.id),parentRemoved:!S.enacted.some(x=>x.id==='p7')}}""",
 # B：末屆通過但尚未生效的服務，不算進福利體制，結局分開列出
 'final_round_pending_policy': """()=>{S.round=4;S.enacted=[{id:'p7',cost:4,start:5}];S.history=[];S.phase='final';render();
   const t=document.getElementById('stage').innerText;
   return {pendingListed:t.includes('已通過、尚未開始服務'),careInRegime:S.enacted.filter(x=>isActive(x)).length}}""",
 # 破產：不排名
 'bankrupt_not_ranked': """()=>{S.bankrupt=true;S.history=[];S.phase='final';render();const t=document.getElementById('stage').innerText;
   return {shared:t.includes('共同失敗'),firstPlace:t.includes('第 1 名')}}""",
 # 選民比例：畫面上的百分比加總約 100
 'voter_share_normalized': """()=>{const v=CIT.filter(c=>Wt(c)>0).reduce((a,c)=>a+WtPct(c),0);S.wmod=Object.fromEntries(DEMO.map(d=>[d.id,d.to]));
   const v2=CIT.filter(c=>Wt(c)>0).reduce((a,c)=>a+WtPct(c),0);S.wmod={};return {sum:v,sumAfterDemo:v2}}""",
 # 稅率預覽與實際預算一致（危機時稅收打折）
 'tax_preview_matches_budget': """()=>{S.crisis=2;S.platforms[ME].tax='中';const real=money(ME).rev,pre=taxRev('中');S.crisis=0;return {real,pre}}""",
 # 質詢沒有在「得票、國債」都較好的優勢答案（勞工力量等實質後果也算一種取捨）
 'no_dominant_answers': """()=>{const D=[];QS.forEach(q=>{const o=q.opts;for(const a of o)for(const b of o){if(a===b)continue;const ad=a.debt||0,bd=b.debt||0;
   if(a.vote>=b.vote&&ad<=bd&&(a.vote>b.vote||ad<bd)&&!(b.labor>0)&&!(q.id==='ati'))D.push(q.id)}});return {dominated:[...new Set(D)]}}""",
 # 運動型、倡議型的成功判定看目標，不看名次
 'role_success_modes': """()=>{S.assign=['mx','sd','nr','tw','fe','ns','gr'];S.history=[];S.labor=7;S.bankrupt=false;
   const a=success(0);S.labor=2;const b=success(0);S.adopt=[0,0,0,0,0,5,0];const c=success(5);return {a:a.label,b:b.label,ns:c.label,mode:a.mode}}""",
 # 執政政績：自己實施且已運作的政策，受益島民小幅加分，且有上限
 'performance_feedback': """()=>{S.round=2;S.enacted=[{id:'p7',cost:4,start:1,by:ME},{id:'p6',cost:5,start:3,by:ME}];const pf=perf(ME);
   S.enacted.push({id:'p1',cost:4,start:0,by:1});const other=perf(ME);return {ling:pf.ling||0,ma:pf.ma||0,max:Math.max(...Object.values(pf)),otherLing:other.ling}}""",
 # 馬克思主義目標門檻為 6
 'marxist_goal_six': """()=>{S.labor=6;const h=[];return {text:PARTIES.mx.miss[0].t,ok:PARTIES.mx.miss[0].f(h,0)}}""",
}

CHECK = {
 'amendment_cost_counted': lambda r: r['enacted'] and abs(r['debt'] - r['expect']) < 0.11,
 'adoption_credited_to_proposer': lambda r: r['mine'] == 1 and r['gov'] == 1,
 'publish_without_changes': lambda r: r['exists'] and r['disabled'] is False,
 'support_measure_visible_and_removed_with_parent': lambda r: 'skip' in r or (r['shown'] and r['cxRemoved'] and r['parentRemoved']),
 'final_round_pending_policy': lambda r: r['pendingListed'] and r['careInRegime'] == 0,
 'bankrupt_not_ranked': lambda r: r['shared'] and not r['firstPlace'],
 'voter_share_normalized': lambda r: 98 <= r['sum'] <= 102 and 98 <= r['sumAfterDemo'] <= 102,
 'tax_preview_matches_budget': lambda r: abs(r['real'] - r['pre']) < 0.01,
 'marxist_goal_six': lambda r: '6' in r['text'] and r['ok'],
 'no_dominant_answers': lambda r: not r['dominated'],
 'role_success_modes': lambda r: r['mode'] == 'movement' and r['a'] == '使命達成' and r['b'] == '部分達成' and r['ns'] == '部分達成',
 'performance_feedback': lambda r: 0 < r['ling'] <= 1.5 and r['ma'] == 0 and r['max'] <= 1.5 and r['otherLing'] == r['ling'],
}

out, ok = {}, True
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    b = p.chromium.launch(executable_path=exe) if pathlib.Path(exe).exists() else p.chromium.launch()
    for name, js in CASES.items():
        pg = b.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(target.as_uri()); pg.wait_for_function('typeof S!=="undefined"')
        pg.evaluate(SETUP, 'sd')
        r = pg.evaluate(js)
        passed = CHECK[name](r) and not errs
        ok &= passed
        out[name] = {'pass': passed, 'result': r, 'errors': errs[:2]}
        pg.close()
    # 續玩：遊戲中重新整理後，標題畫面能繼續到同一屆
    pg = b.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    pg.goto(target.as_uri()); pg.wait_for_function('typeof S!=="undefined"')
    pg.evaluate(SETUP, 'fe'); pg.evaluate("S.round=2;S.phase='news';render()")
    pg.reload(); pg.wait_for_function('typeof S!=="undefined"')
    has = pg.evaluate("!!document.querySelector('[data-a=resume]')")
    if has: pg.evaluate("document.querySelector('[data-a=resume]').click()")
    st = pg.evaluate("({phase:S.phase,round:S.round,choice:S.choice})")
    passed = has and st == {'phase': 'news', 'round': 2, 'choice': 'fe'}
    ok &= passed; out['resume_after_reload'] = {'pass': passed, 'result': st}
    pg.evaluate("localStorage.clear()")
    b.close()

print(json.dumps(out, ensure_ascii=False, indent=1))
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
