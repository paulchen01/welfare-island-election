"""世界各國政策卡 v0.3（19 張）：補足馬克思主義、女性主義、綠色主義的政策卡，並加入中間偏右案例維持平衡。

用法：python3 docs/data/world_policies_v0.3.py && python3 docs/data/embed_policy_meta.py && node build.mjs

本檔是這 19 張卡的唯一來源，會產生：
1. src/game.js 中「世界各國政策 v0.3」區塊（遊戲數值：標籤、成本、效果、島民反應、台詞）
2. docs/data/policy_meta_v0.3.json（= v0.2 的 78 張 + 這 19 張的責任分工、觀點評價與現實出處）
改卡片請改本檔再重跑，不要手改產生出來的區塊。

數值（cost、fx、cit）比照既有相近政策設定，是遊戲用的簡化，不代表真實規模。
"""
import json, pathlib, re

root = pathlib.Path(__file__).resolve().parents[2]

# 欄位：id, name, tags, cost, d, fx, cit, say, roles(pv,py,tg), expect(gain,risk), views[(觀點, 立場, 理由)], layer, source(標題, 網址)
W = [
 dict(id='w1', name='勞工董事共同決定', tags=['rights'], cost=0,
  d='員工 2000 人以上的大企業，監事會一半席次由勞工選出，參與重大經營決策。',
  fx={'str': -1}, cit={'chen': 1, 'zhen': 2, 'kevin': 1, 'wang': -3, 'de': -1},
  say={'zhen': '公司要裁員，勞工代表至少能在董事會上表達意見。', 'wang': '經營決策都要跟工會商量，速度會慢很多。'},
  roles=('企業（勞資共治）', '企業（決策成本）', '大型企業的受僱者'),
  expect=('勞工對裁員、工作條件有發言權', '只適用大企業，股東代表仍握最後一票'),
  views=[('馬克思主義', '支持', '讓勞工參與生產決策，挑戰資本獨占經營權'), ('社會民主', '支持', '勞資夥伴共同治理的傳統'), ('新右派', '批評', '干預財產權，降低企業決策效率')],
  layer='制度', source=('德國《共同決定法》（1976）', 'https://en.wikipedia.org/wiki/Mitbestimmungsgesetz')),
 dict(id='w2', name='受僱者基金', tags=['rights', 'reform'], cost=0,
  d='對企業超額利潤課徵一定比例，轉入由工會代表管理的基金，逐步持有企業股份。',
  fx={'str': -1, 'eco': -0.3}, cit={'zhen': 2, 'chen': 2, 'ling': 1, 'kevin': -2, 'wang': -4, 'de': -1},
  say={'chen': '公司賺的錢，終於有一部分是我們的。', 'wang': '這是在沒收企業，誰還敢投資？'},
  roles=('工會代表管理的基金', '獲利較高的企業', '全體受僱者'),
  expect=('企業獲利的一部分回到勞工手中', '企業反彈強烈，瑞典實施 7 年後廢止'),
  views=[('馬克思主義', '支持', '勞工逐步共同擁有生產工具'), ('社會民主', '保留', '瑞典社民黨內部也有分歧，最後在 1991 年廢止'), ('新右派', '批評', '走向社會主義，打擊投資意願'), ('第三條路', '批評', '以集體持股取代市場投資，與社會投資路線不同')],
  layer='制度', source=('瑞典受僱者基金（梅德納計畫，1984–1991）', 'https://en.wikipedia.org/wiki/Employee_funds')),
 dict(id='w3', name='富人團結稅', tags=['reform'], cost=-2,
  d='淨資產超過門檻的富人，每年依資產課徵 1.7%–3.5% 的累進稅。',
  fx={'str': -1, 'eco': -0.2}, cit={'chen': 1, 'zhen': 2, 'ling': 1, 'ma': 1, 'kevin': -2, 'wang': -3, 'liu': -1},
  say={'zhen': '薪水都被房租吃掉，資產多的人多繳一點很合理。', 'wang': '資產稅會把有錢人和資金趕到國外。'},
  roles=('政府', '淨資產超過門檻的富人', '稅收用於全體'),
  expect=('增加財源，縮小財富差距', '資產難估值，富人可能移居或轉移資產'),
  views=[('馬克思主義', '支持', '直接處理財富集中'), ('社會民主', '支持', '累進稅支撐普及福利'), ('新右派', '批評', '資本外逃、重複課稅'), ('第三條路', '保留', '支持公平稅負，但擔心資本外移、影響投資')],
  layer='制度', source=('西班牙大額財富團結稅（2022）', 'https://www.thelocal.es/20230614/qa-how-does-spains-solidarity-tax-on-wealth-work')),
 dict(id='w4', name='產業別工資委員會', tags=['rights'], cost=0,
  d='政府、工會與雇主按產業一起協商最低工資與勞動條件，協議適用整個產業。',
  fx={'pov': -1, 'str': -1}, cit={'chen': 2, 'zhen': 2, 'ling': 2, 'ati': 1, 'wang': -2, 'de': -2},
  say={'ling': '小公司沒有工會，現在也能照產業協議加薪。', 'de': '產業統一工資，我這種小攤子付不起。'},
  roles=('政府、工會、雇主三方', '雇主（人事成本）', '各產業的受僱者'),
  expect=('沒有工會的小公司員工也受協議保障', '小店家可能負擔不起產業統一工資'),
  views=[('馬克思主義', '支持', '集體力量提高勞工議價能力'), ('社會民主', '支持', '三方協商的勞資夥伴關係'), ('新右派', '批評', '工資僵固，小企業負擔不起')],
  layer='制度', source=('烏拉圭工資委員會重新啟動（2005）', 'https://www.gub.uy/presidencia/comunicacion/noticias/reinstalacion-consejos-salarios-2005-posibilito-bajar-pobreza-aumentar')),
 dict(id='w5', name='員工承購合作社', tags=['civ', 'rights'], cost=1,
  d='公司倒閉時，員工可以把失業給付一次領出作為資本，承接公司並改成員工合作社。',
  fx={'emp': 1, 'eco': 0.3}, cit={'chen': 2, 'de': 1, 'zhen': 1, 'wang': 1},
  say={'chen': '與其一起失業，不如大家一起當老闆。'},
  roles=('員工合作社與政策性融資機構', '失業給付預付＋政府融資', '即將倒閉公司的員工'),
  expect=('保住工作與技術', '合作社仍有經營風險'),
  views=[('馬克思主義', '支持', '勞工自主管理生產'), ('第三條路', '支持', '把消極給付轉成積極就業'), ('新右派', '保留', '民間自主可以，但政府不該貼錢救經營不善的公司')],
  layer='產業', source=('義大利《馬可拉法》（1985）', 'https://gr.boell.org/sites/default/files/uploads/2015/10/the-marcora-law.pdf')),
 dict(id='w6', name='工會經辦失業保險', tags=['ins', 'rights'], cost=2,
  d='失業保險由工會設立的基金經辦，政府補助並監督，給付依原本薪資計算。',
  fx={'dec': 1, 'pov': -1}, cit={'chen': 2, 'zhen': 1, 'kevin': 1, 'wang': -1, 'de': -1},
  say={'zhen': '加入工會不只為了抗爭，失業時也有人照應。'},
  roles=('工會設立的失業基金', '會員保費＋政府補助', '加入基金的受僱者'),
  expect=('失業時的所得替代較高', '沒加入基金的人保障較少'),
  views=[('馬克思主義', '支持', '強化工會的組織力量'), ('社會民主', '支持', '工會與國家共同提供保障'), ('新右派', '批評', '變相鼓勵入會，獨厚工會')],
  layer='制度', source=('根特制（丹麥、瑞典、芬蘭、冰島）', 'https://en.wikipedia.org/wiki/Ghent_system')),
 dict(id='w7', name='縮短工時試行', tags=['rights', 'green'], cost=1,
  d='公部門先試行縮短每週工時、薪水不減，再評估擴大到民間。',
  fx={'def': 1, 'env': 1}, cit={'zhen': 3, 'ling': 3, 'chen': 1, 'kevin': 2, 'wang': -2, 'de': -1},
  say={'ling': '多一個下午，可以去接孩子放學。', 'wang': '人少一天，訂單誰來趕？'},
  roles=('政府（公部門先行）', '雇主（人力調度成本）', '試辦單位的員工'),
  expect=('壓力與倦怠降低，生產力大致維持', '服務業、製造業不一定能照搬'),
  views=[('馬克思主義', '支持', '把生產力成果還給勞工的時間'), ('女性主義', '支持', '讓男女都有時間分擔照顧'), ('綠色主義', '支持', '不追求更多產出與消費，減少碳排'), ('新右派', '批評', '工時應由勞資自行協商')],
  layer='制度', source=('冰島縮短工時試驗（2015–2019）', 'https://www.kshb.com/news/national/icelandic-trials-studying-shorter-workweeks-hailed-as-overwhelming-successes')),
 dict(id='w8', name='自來水回歸公營', tags=['univ'], cost=1,
  d='結束與民間水務公司的特許合約，由市政府成立公營公司供水。',
  fx={'pov': -1, 'dec': 1}, cit={'ma': 1, 'ling': 1, 'chen': 1, 'liu': 1, 'wang': -1},
  say={'ma': '水費沒漲，水管也有人來修。'},
  roles=('市政府公營水務公司', '用戶水費', '全體居民'),
  expect=('盈餘回到水價與管線投資', '公營也可能有效率與管理問題'),
  views=[('馬克思主義', '支持', '民生必需品去商品化'), ('綠色主義', '支持', '公共管理水資源，重視長期永續'), ('新右派', '批評', '公營缺乏效率，應用契約管理民間業者')],
  layer='制度', source=('法國巴黎自來水回歸公營（2010）', 'https://theecologist.org/2014/feb/21/public-water-no-pipe-dream')),
 dict(id='w9', name='外包勞工協商權保障', tags=['rights'], cost=0,
  d='外包、派遣與平台勞工可以向實際掌控工作條件的母公司協商，並限制企業向罷工勞工求償。',
  fx={'str': -1}, cit={'chen': 3, 'zhen': 1, 'ati': 1, 'wang': -3, 'kevin': -1},
  say={'chen': '真正決定我收入的是平台，現在終於能直接談了。', 'wang': '外包商的事都要我出面談，經營風險太大。'},
  roles=('政府（修法）', '母公司與企業', '外包、派遣與平台勞工'),
  expect=('非典型勞工也有議價能力', '勞資爭議可能增加'),
  views=[('馬克思主義', '支持', '讓實際掌握生產的資本負起雇主責任'), ('新社會運動', '支持', '保障非典型勞工的集體權利'), ('新右派', '批評', '增加企業法律風險，影響投資')],
  layer='制度', source=('南韓《工會法》修正（俗稱黃色信封法，2025）', 'https://www.bakermckenzie.com/en/insight/publications/alerts/2025/08/south-korea-yellow-envelope-act-passed')),
 dict(id='w10', name='父母各半育嬰假', tags=['care', 'rights'], cost=2,
  d='父母各有 6 個月育嬰假，只有 6 週可以轉給對方，期間領八成薪。',
  fx={'def': 2, 'emp': 1}, cit={'ling': 2, 'kevin': 2, 'zhen': 2, 'wang': -2, 'de': -1},
  say={'kevin': '爸爸一定會請，請假不用再看主管臉色。', 'wang': '一次少兩個人，排班很頭痛。'},
  roles=('育嬰假給付（社會保險）', '保費＋政府', '有工作的父母'),
  expect=('父親請假比例提高，照顧更平均', '自營與零工者用不到；雇主調度成本'),
  views=[('女性主義', '支持', '讓父親也承擔照顧，改變性別分工'), ('社會民主', '支持', '普及且依所得計算的社會保險給付'), ('新右派', '保留', '（新保守）家庭應自己決定誰照顧')],
  layer='制度', source=('冰島《育嬰假法》（2021）', 'https://www.norden.org/en/info-norden/parental-benefit-iceland')),
 dict(id='w11', name='同工同酬認證', tags=['rights'], cost=0,
  d='25 人以上的企業必須通過外部稽核，證明同樣價值的工作支付同樣的薪水。',
  fx={'stg': -1}, cit={'ling': 2, 'zhen': 2, 'xiang': 1, 'wang': -2, 'kevin': -1},
  say={'ling': '同樣的工作，終於不用再猜自己是不是領得比較少。'},
  roles=('企業（外部稽核）', '企業（稽核成本）', '25 人以上企業的員工'),
  expect=('讓薪資差距看得見', '小企業的行政負擔'),
  views=[('女性主義', '支持', '從制度面處理性別薪資差距'), ('新社會運動', '支持', '反歧視，承認被低估的工作價值'), ('新右派', '批評', '行政成本高，薪資應由市場決定')],
  layer='制度', source=('冰島同工同酬認證（2018）', 'https://government.is/news/article/2018/01/04/New-Icelandic-law-on-Equal-Pay-Certification-entered-into-force-on-January-1-2018')),
 dict(id='w12', name='照顧年資計入年金', tags=['ins', 'care', 'fam'], cost=2,
  d='照顧幼兒的父母，每個孩子有 3 年由政府代繳年金保費，退休金不因照顧而中斷。',
  fx={'pov': -1}, cit={'ling': 2, 'ma': 1, 'liu': 1, 'de': 1},
  say={'ling': '在家帶小孩那幾年，退休金也有算到。'},
  roles=('年金保險', '政府（稅收代繳）', '照顧幼兒的父母'),
  expect=('照顧者的老年經濟較有保障', '可能鼓勵母親較長期退出職場'),
  views=[('女性主義', '支持', '承認無酬照顧的價值'), ('新右派', '支持', '（新保守）肯定家庭照顧的貢獻'), ('馬克思主義', '保留', '補償照顧，但照顧仍主要落在母親身上')],
  layer='制度', source=('德國年金保險育兒年資（1992 年後出生每孩 3 年）', 'https://tuenews.de/en/the-state-pays-pension-contributions-for-raising-children/')),
 dict(id='w13', name='碳費全民分紅', tags=['green', 'univ'], cost=0,
  d='對燃料課徵碳費，大部分收入平均退還每位居民；用油用電少的人反而賺。',
  fx={'env': 2}, cit={'zhen': 2, 'chen': 1, 'ling': 1, 'yuma': 1, 'wang': -2, 'de': -1},
  say={'zhen': '我騎車通勤，碳費分紅比我繳的還多。', 'yuma': '山上只能開車，希望偏鄉另外有配套。'},
  roles=('政府（隨健保保費退還）', '使用化石燃料的家庭與企業', '全體居民（平均分紅）'),
  expect=('減碳，低耗能家庭可能淨賺', '偏鄉、通勤距離長的人負擔較重'),
  views=[('綠色主義', '支持', '讓污染有價格，又不加重弱勢負擔'), ('新右派', '保留', '用價格機制取代管制可以接受，但仍是新稅'), ('馬克思主義', '批評', '個人分紅沒有改變生產結構')],
  layer='能源', source=('瑞士二氧化碳稅退還（隨健保保費）', 'https://www.helsana.ch/dam/en/pdf/individuals/brochures/information-sheet-environmental-levies-2027.pdf')),
 dict(id='w14', name='修理減稅', tags=['green', 'reform'], cost=1,
  d='修理衣服、鞋子、腳踏車的營業稅減半，修家電的工資可以抵稅。',
  fx={'env': 1, 'emp': 1}, cit={'de': 2, 'zhen': 1, 'ma': 1, 'liu': 1},
  say={'de': '修鞋修傘的老師傅，生意又回來了。'},
  roles=('修理店、小商家', '政府少收稅', '全體消費者'),
  expect=('修理比買新便宜，增加在地工作', '修理費若仍高，效果有限'),
  views=[('綠色主義', '支持', '延長物品壽命，減少丟棄'), ('新右派', '支持', '以減稅引導，而不是管制'), ('馬克思主義', '保留', '方向正確，但沒處理大量生產的根源')],
  layer='產業', source=('瑞典修理減稅（2017）', 'https://www.wgbh.org/news/2017-01-03/sweden-tries-to-curb-buy-and-throw-away-culture-through-tax-breaks')),
 dict(id='w15', name='煤礦公正轉型協議', tags=['green', 'inv', 'rights'], cost=3,
  d='關閉煤礦時，政府與工會協議提早退休、轉職與礦區生態復育，礦工優先受僱。',
  fx={'env': 2, 'emp': 1}, cit={'chen': 2, 'yuma': 1, 'zhen': 1, 'wang': -1},
  say={'chen': '礦場關了，至少復育工程讓我們先上工。'},
  roles=('政府、工會共同規劃', '稅收', '化石燃料產業勞工與礦區居民'),
  expect=('減碳，同時照顧受衝擊的勞工', '成本高，新產業不一定留得住年輕人'),
  views=[('綠色主義', '支持', '淘汰化石燃料'), ('馬克思主義', '支持', '轉型代價不由勞工獨自承擔'), ('第三條路', '支持', '投資轉職與新產業'), ('新右派', '批評', '補助成本高，應由市場調整')],
  layer='能源', source=('西班牙煤礦公正轉型協議（2018）', 'https://www.industriall-union.org/spanish-coal-unions-win-landmark-just-transition-deal')),
 dict(id='w16', name='飲料瓶押金制度', tags=['green', 'mkt'], cost=0,
  d='一次性飲料瓶加收押金，空瓶拿回店裡就退錢。',
  fx={'env': 1}, cit={'zhen': 1, 'ma': 1, 'de': -1, 'wang': -1},
  say={'ma': '撿瓶子退押金，還能貼補一點零用。', 'de': '店裡還要收空瓶，地方都不夠放。'},
  roles=('商店與回收系統', '消費者先付押金、業者負擔回收成本', '全體居民'),
  expect=('回收變成習慣，減少垃圾', '小商店的收瓶空間與人力負擔'),
  views=[('綠色主義', '支持', '讓回收變成日常習慣'), ('新右派', '支持', '用經濟誘因，不靠禁令'), ('馬克思主義', '保留', '責任落在消費者，生產者責任仍不足')],
  layer='制度', source=('德國一次性飲料瓶押金（2003）', 'https://www.goethe.de/prj/ger/en/wow/nachhaltig-erklaert/27021598.html')),
 dict(id='w17', name='個人公積金帳戶', tags=['mkt', 'ins'], cost=-1,
  d='勞雇每月強制提撥到個人帳戶，存的錢用在自己的住宅、醫療與退休。',
  fx={'str': 1, 'dec': -1}, cit={'kevin': 3, 'wang': 1, 'zhen': 1, 'chen': -1, 'ma': -1},
  say={'kevin': '自己存自己用，不用擔心以後被下一代砍。', 'chen': '薪水這麼低，帳戶根本存不了多少。'},
  roles=('公積金機構', '勞工與雇主提撥', '受僱者'),
  expect=('不依賴政府財政，世代負擔清楚', '低薪與照顧中斷者帳戶存不夠'),
  views=[('新右派', '支持', '個人責任，不變成世代互相負擔'), ('第三條路', '保留', '強制儲蓄可以，但低薪者需要補助'), ('社會民主', '批評', '沒有風險分攤，低薪者老後保障不足')],
  layer='制度', source=('新加坡中央公積金（1955）', 'https://www.3ecpa.com.sg/resources/business-compendium/central-provident-fund-cpf')),
 dict(id='w18', name='學校教育券', tags=['mkt'], cost=1,
  d='公費按學生人數撥給學校，家長可以自由選擇公立或民間學校。',
  fx={'eco': 0.2}, cit={'kevin': 3, 'ling': 1, 'zhen': -1, 'yuma': -1},
  say={'kevin': '可以幫孩子挑適合的學校，選擇變多了。', 'yuma': '山上只有一間學校，教育券對我們沒差。'},
  roles=('公立與民間學校', '稅收（按學生撥款）', '學齡兒童的家庭'),
  expect=('家長有選擇，學校彼此競爭', '學校分化，偏鄉沒有選擇'),
  views=[('新右派', '支持', '家長選擇與學校競爭'), ('第三條路', '保留', '選擇可以，但要保障弱勢學生'), ('社會民主', '批評', '加深學校分化與階層化'), ('馬克思主義', '批評', '教育變成營利生意')],
  layer='學校', source=('瑞典自由學校改革（1992）', 'https://skolkoll.se/en/glossary/friskolereformen/')),
 dict(id='w19', name='彈性安全', tags=['inv', 'ins'], cost=3,
  d='企業解僱較容易，但失業給付高，並積極輔導再就業，三者搭配。',
  fx={'emp': 2, 'dec': 1}, cit={'kevin': 2, 'wang': 2, 'chen': 1, 'zhen': 1, 'de': 1},
  say={'wang': '景氣差時能調整人力，我才敢多請人。', 'chen': '被裁了也有錢撐著，還有人幫我找下一份工作。'},
  roles=('政府與勞資協商', '稅收與失業保險', '受僱者與企業'),
  expect=('就業流動高，失業時有保障', '需要高稅收支撐；解僱較容易'),
  views=[('第三條路', '支持', '保障人，而不是保障職位'), ('社會民主', '支持', '高給付與勞資協商的北歐模式'), ('馬克思主義', '批評', '解僱更容易，勞工議價力下降')],
  layer='制度', source=('丹麥彈性安全「黃金三角」', 'https://en.wikipedia.org/wiki/Flexicurity')),
]

GROUP = '世界各國政策（v0.3 新增）'
LAYER_KEY = {'照顧服務': 'care', '交通': 'transport', '住宅': 'housing', '能源': 'energy', '社區設施': 'community', '醫療': 'health', '學校': 'school', '產業': 'industry'}

def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

def main():
    ids = [w['id'] for w in W]
    assert len(ids) == len(set(ids)), 'duplicate id'
    cits = {'ma', 'chen', 'ling', 'xiang', 'kevin', 'wang', 'de', 'yuma', 'liu', 'ati', 'zhen'}
    views_ok = {'社會民主', '新右派', '第三條路', '馬克思主義', '女性主義', '新社會運動', '綠色主義'}
    for w in W:
        assert set(w['cit']) <= cits and set(w['say']) <= cits, w['id']
        assert all(v[0] in views_ok and v[1] in ('支持', '保留', '批評') for v in w['views']), w['id']
        assert len({v[0] for v in w['views']}) == len(w['views']), w['id']
        assert any(v[1] == '批評' for v in w['views']) or any(v[1] == '保留' for v in w['views']), w['id'] + ' needs a critical voice'
    # 1) game.js 區塊
    lines = [f" {{id:'{w['id']}',name:{js(w['name'])},tags:{js(w['tags'])},cost:{w['cost']},d:{js(w['d'])},fx:{js(w['fx'])},cit:{js(w['cit'])},say:{js(w['say'])},src:{js(w['source'][0])}}}" for w in W]
    block = ("// ---- 世界各國政策 v0.3（由 docs/data/world_policies_v0.3.py 產生，請勿手改）----\nPOL.push(\n" + ',\n'.join(lines) + "\n);\n"
             "const WORLD_LAYERS=" + js({w['id']: LAYER_KEY[w['layer']] for w in W if w['layer'] in LAYER_KEY}) + ";\n"
             "// ---- END 世界各國政策 ----\n")
    gp = root / 'src' / 'game.js'
    s = gp.read_text(encoding='utf8')
    pat = re.compile(r"// ---- 世界各國政策 v0\.3.*?// ---- END 世界各國政策 ----\n", re.S)
    if pat.search(s):
        s = pat.sub(lambda m: block, s)
    else:
        anchor = "POL.push(...EVPOL,...PETS.map(t=>t.card));\n"
        assert anchor in s
        s = s.replace(anchor, block + anchor, 1)
    gp.write_text(s, encoding='utf8')
    # 2) policy_meta_v0.3.json
    base = json.loads((root / 'docs' / 'data' / 'policy_meta_v0.2.json').read_text(encoding='utf8'))
    base = [x for x in base if x['id'] not in ids]
    for w in W:
        base.append({'id': w['id'], 'name': w['name'], 'group': GROUP,
                     'roles': {'provider': w['roles'][0], 'payer': w['roles'][1], 'target': w['roles'][2]},
                     'expect': {'gain': w['expect'][0], 'concern': w['expect'][1]},
                     'views': [{'view': a, 'stance': b, 'why': c} for a, b, c in w['views']],
                     'islandLayer': w['layer'], 'recog': False,
                     'source': {'title': w['source'][0], 'url': w['source'][1]}})
    (root / 'docs' / 'data' / 'policy_meta_v0.3.json').write_text(json.dumps(base, ensure_ascii=False, indent=1), encoding='utf8')
    print('wrote', len(W), 'world policies; meta total', len(base))

if __name__ == '__main__':
    main()
