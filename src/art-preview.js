/* Issue #2: self-contained presentation prototype; never reads or writes game state. */
(() => {
  const $ = (s) => document.querySelector(s);
  const main = $("#preview");
  const bar = $("#actionbar");
  const missing = "未提供";
  const views = [
    ["社會民主觀點", "#456A8C"],
    ["新右派", "#906B44"],
    ["第三條路", "#6D648D"],
    ["馬克思主義", "#A35F50"],
    ["女性主義", "#8A6580"],
    ["新社會運動", "#527D78"],
    ["綠色主義", "#657C4F"],
  ];
  const layers = [
    ["care", "照顧服務"],
    ["transport", "交通"],
    ["housing", "住宅"],
    ["energy", "能源"],
    ["community", "社區設施"],
    ["health", "醫療"],
    ["school", "學校"],
    ["industry", "產業"],
  ];
  const policies = [
    {
      id: "p5",
      name: "長照服務券",
      cost: 2,
      tags: "市場化・照顧",
      desc: "發給長照服務券，由民間業者提供服務，民眾自由選擇。",
    },
    {
      id: "p6",
      name: "長照公共服務網",
      cost: 5,
      tags: "普及式・照顧",
      desc: "政府直接設置居家服務、日照中心與社區據點。",
    },
    {
      id: "p3",
      name: "國民基礎年金",
      cost: 5,
      tags: "普及式・老年保障",
      desc: "65 歲以上國民每月一筆基本年金，財源來自稅收。",
    },
  ];
  const selected = new Set();
  let timer,
    noticeTimer,
    currentView = "budget";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const portrait = (id, mood = "neutral", cls = "portrait") =>
    `<span class="painted-portrait ${cls}" role="img" aria-label="${id === "ma" ? "秀英阿嬤" : "阿蒂"}，${{ happy: "開心", neutral: "平靜", upset: "不滿" }[mood]}表情"><img src="../assets/characters/${id}-expressions.webp" alt="" style="transform:translateX(-${{ happy: 0, neutral: 100 / 3, upset: 200 / 3 }[mood]}%)"></span>`;
  // x, ground anchor y, width as percentages of the complete scene.
  const objects = [
    [29, 58, 15],
    [39, 74, 12],
    [55, 60, 16],
    [72, 42, 12],
    [25, 78, 15],
    [73, 65, 14],
    [52, 83, 16],
    [73, 83, 14],
  ];
  const scene = (active = ["care", "transport", "housing"]) =>
    `<div class="scene" role="img" aria-label="模型水粉插畫島嶼；編號對照下方圖例，並非本局實施紀錄"><img class="painted-base" src="../assets/scenes/island-painted.webp" alt="">${layers.map(([id], i) => `<span class="painted-building" data-layer="${id}" style="left:${objects[i][0]}%;top:${objects[i][1]}%;width:${objects[i][2]}%" ${active.includes(id) ? "" : "hidden"}><img src="../assets/scenes/services-painted.webp" alt="" style="transform:translate(-${(i % 4) * 25}%,-${Math.floor(i / 4) * 50}%)"></span>`).join("")}${layers.map(([id], i) => `<span class="map-marker" data-marker="${id}" aria-hidden="true" style="left:${objects[i][0]}%;top:${objects[i][1] - (objects[i][2] * 780) / 430 + 5}%" ${active.includes(id) ? "" : "hidden"}>${i + 1}</span>`).join("")}</div><div class="layer-legend" aria-label="目前顯示的素材圖層">${layers.map(([id, name], i) => `<span data-legend="${id}" ${active.includes(id) ? "" : "hidden"}><b>${i + 1}</b> ${name}</span>`).join("")}<span class="empty-legend" ${active.length ? "hidden" : ""}>僅顯示島嶼底圖</span></div>`;
  const roles = (labels) =>
    `<dl class="roles">${labels.map((x) => `<div><dt>${x}</dt><dd>${missing}</dd></div>`).join("")}</dl>`;
  const intro = (tag, title, sub) =>
    `<span class="eyebrow">${tag}</span><h1>${title}</h1><p class="sub">${sub}</p>`;
  function notify(text) {
    clearTimeout(noticeTimer);
    $("#notice").textContent = text;
    noticeTimer = setTimeout(() => ($("#notice").textContent = ""), 4000);
  }
  function card(p) {
    return `<article class="policy ${selected.has(p.id) ? "selected" : ""}" data-policy="${p.id}"><div class="policy-top"><img class="icon" src="../assets/icons/${p.id === "p3" ? "institution" : "care"}.svg" alt=""><h3>${p.name}</h3><span class="cost">成本 ${p.cost}</span></div><p class="tags">${p.tags} · 基準版政策</p><div class="policy-actions"><button data-detail="${p.id}" aria-controls="detail-${p.id}" aria-expanded="false">責任與影響</button><button class="add" data-add="${p.id}" aria-pressed="${selected.has(p.id)}">${selected.has(p.id) ? "已加入 ✓" : "加入政見 ＋"}</button></div><section class="card-detail" id="detail-${p.id}" hidden><p>${p.desc}</p>${roles(["誰提供", "誰負擔", "服務對象", "預期受益者", "可能受損者", "預期改善", "需要考量", "觀點關聯"])}<p class="sub">責任與影響欄位待審定。支持度變化不等同實際受益。</p></section></article>`;
  }
  function budget() {
    main.innerHTML =
      intro(
        "03 / 政策選擇",
        "這一屆，你會怎麼分配？",
        "先看誰負擔、誰受益，再決定你的政見。",
      ) +
      `<details class="helper"><summary>島民需求・既有方案・政黨能力</summary><p>正式版在此展開原有資訊。此處僅示範收合版面。</p></details><div class="row"><span class="label">政策樣張 / 3 張</span><span class="label" id="selected-count">已選 ${selected.size} 張</span></div><div style="height:12px"></div>${policies.map(card).join("")}<div class="strip">選入政見 ≠ 已經實施。實施政策須依選舉結果與執政紀錄確認。</div>`;
    bar.innerHTML = `<div class="balance">財政結餘<strong>${missing}</strong></div><button data-action="announce">公布政見 →</button>`;
  }
  function results() {
    main.innerHTML =
      intro(
        "03 / 開票結果",
        "票數背後，是不同的期待。",
        "排序與票數須由本局結果提供。",
      ) +
      `<section class="result-card"><span class="label">執政黨</span><h2>${missing}</h2><p class="sub">得票率：${missing} · 此處未設定示範贏家</p>${views.map(([name, color]) => `<div class="rank-row"><div class="rank-name"><b><i class="swatch" style="background:${color}"></i>${name}</b><span>${missing}</span></div><div class="empty-bar" aria-hidden="true"></div></div>`).join("")}</section><section class="panel"><div class="citizen">${portrait("ma")}<div><b>秀英阿嬤</b><p>獨居長者，住在山邊老社區</p></div></div><p class="quote">政策回應：${missing}</p></section><details class="helper"><summary>展開質詢與對手政見</summary><p>沿用 rResults 的質詢流程；回答後才顯示確認執政操作。</p></details>`;
    bar.innerHTML = `<div class="balance">新增實施政策<strong>${missing}</strong></div><button data-action="confirm">確認執政 →</button>`;
  }
  function final() {
    main.innerHTML =
      intro(
        "05 / 體制揭曉",
        "你留下了怎樣的福利島？",
        "回看五屆決策，也回看沒有被照顧到的人。",
      ) +
      scene(["care", "housing", "transport", "energy"]) +
      `<span class="label">上圖為素材組合展示</span><section class="result-card"><span class="label">本局福利體制</span><h2>${missing}</h2><p class="sub">體制是政策組合的結果，不是玩家人格或優劣評分。</p>${roles(["體制判定依據", "五屆實施紀錄", "指標結果"])}</section><h2>用不同觀點，再看一次</h2><div class="view-list">${views.map(([v]) => `<span>${v}</span>`).join("")}</div><div class="strip">七種觀點與福利體制分類是兩個層次，不直接一對一對應。</div><label for="reflection"><b>我的反思（樣稿，不會送出）</b></label><p class="sub">哪個選擇最需要說明？你會如何回應另一種觀點？</p><textarea class="reflection" id="reflection" placeholder="在這裡試寫；離開畫面不保存"></textarea>`;
    bar.innerHTML = `<div class="balance">回看決策<strong>五屆紀錄</strong></div><button data-action="reflection">查看學習單 →</button>`;
  }
  function news() {
    main.innerHTML =
      intro(
        "03 / 福利島日報",
        "改變，留在島上。",
        "每屆新聞頁最上方，呈現政策實施的痕跡。",
      ) +
      scene() +
      `<div class="scene-key"><span class="chip">素材展示</span><span class="chip">同類服務聚合成一個圖層</span></div><section class="panel"><h2>圖層展示控制</h2><p class="sub">勾選只測試素材，不代表政策已實施。</p><div class="layer-controls">${layers.map(([id, name]) => `<label><input type="checkbox" data-toggle-layer="${id}" ${["care", "transport", "housing"].includes(id) ? "checked" : ""}>${name}</label>`).join("")}</div><label for="layer-mode">顯示狀態</label><select id="layer-mode"><option value="enacted">實施圖層樣式</option><option value="preview">提案預覽樣式（淡色）</option></select></section><div class="strip" id="layer-caption">實施圖層樣式示範；尚無真實政策紀錄。</div><p>制度型政策另用文字紀錄，不畫成建築。建物亮起不表示服務品質提升。</p>`;
    bar.innerHTML = `<div class="balance">新聞與事件<strong>${missing}</strong></div><button data-action="news">繼續閱讀 →</button>`;
  }
  function story() {
    main.innerHTML =
      intro(
        "03 / 回看前兩屆",
        "同一項政策，不同的生活。",
        "第三屆新聞之後、公投之前。",
      ) +
      `<div class="story-art" id="story-art">${scene(["care", "community"])}<div class="actors">${portrait("ma", "neutral", "")}${portrait("ati", "neutral", "")}</div></div><p class="story-note" id="story-status" role="status">靜態故事樣稿 · 資料尚未接入</p><div class="story-controls"><button data-action="play">播放動作樣張</button><button data-action="skip">略過動畫</button><label><input type="checkbox" id="reduce-motion" ${motion.matches ? "checked" : ""}>減少動態（包含系統設定）</label></div><div class="strip">一般回顧版本：未提供來源政策與實施紀錄，因此不聲稱任何政策造成以下變化。</div><section class="story-block"><span class="step-label">01 / 從哪項決策開始</span><h3>來源政策：${missing}</h3><p>實施屆數、執政黨、是否玩家提案：${missing}</p></section><section class="story-block"><span class="step-label">02 / 生活發生什麼改變</span><h3>秀英阿嬤與阿蒂</h3><p>已觀察到的改善：${missing}</p><p>服務落差與新問題：${missing}</p></section><section class="story-block"><span class="step-label">03 / 下一步，交給你思考</span><h3>觀點衝突：${missing}</h3><p>正式版依本局資料顯示方案；選擇加入當屆手牌，不另計分。</p>${[1, 2, 3].map((n) => `<button class="option" disabled><b>方案 ${n} · 等待政策資料</b>下一步內容：${missing}</button>`).join("")}</section>`;
    bar.innerHTML = `<div class="balance">政策來源<strong>${missing}</strong></div><button data-action="story">前往公投 →</button>`;
  }
  function characters() {
    main.innerHTML =
      intro(
        "CHARACTER STUDY",
        "每個人，都有自己的處境。",
        "表情呈現對當下處境的回應，不代表角色價值。",
      ) +
      ["ma", "ati"]
        .map(
          (id) =>
            `<section class="panel"><h2>${id === "ma" ? "秀英阿嬤" : "阿蒂"}</h2><p class="sub">${id === "ma" ? "81 歲 · 獨居，住山邊老社區" : "30 歲 · 印尼籍看護移工，在台第 6 年"}</p><div class="character-grid">${["happy", "neutral", "upset"].map((m) => `<figure>${portrait(id, m, "")}<figcaption>${{ happy: "開心", neutral: "平靜", upset: "不滿" }[m]}</figcaption></figure>`).join("")}</div></section>`,
        )
        .join("") +
      `<div class="strip">兩位角色各 3 種模型水粉表情，以透明 WebP 圖集呈現。移工不投票，但政策影響與當事人敘事仍保留。</div><h2>動作樣張</h2><p>在「第三屆故事」播放依序進場與傾聽的 2.4 秒示範；不以誇張哭泣或勝利姿勢代替論點。</p>`;
    bar.innerHTML = `<div class="balance">模型插畫<strong>每格 260 × 260</strong></div><button data-action="characters">查看故事動作 →</button>`;
  }
  const meta = {
    budget: [
      "政策選擇 / rBudget",
      "三張收合政策卡，成本取自 POL。受益與受損獨立顯示，不把支持度當成政策成果。底部保留結餘與公布政見。",
    ],
    results: [
      "開票結果 / rResults",
      "七觀點同等視覺權重。未知票數使用不定長度虛線，沒有虛構排名、冠軍色或百分比。",
    ],
    final: [
      "體制揭曉 / rFinal",
      "把體制結果與觀點反思分開。無雷達資料就不繪製數值圖。圖層僅示範組合，文字明確標示。",
    ],
    news: [
      "新聞島嶼 / rNews",
      "模型水粉底圖加八個透明插畫物件。制度型政策不用建築代替，選牌預覽與實施紀錄不可混用。",
    ],
    story: [
      "第三屆後果 / 新流程",
      "來源 → 生活變化 → 下一步。此示範使用無來源資料的回顧版本。動畫只改視覺，略過不改資料，也不自動選牌。",
    ],
    characters: [
      "角色 / face",
      "使用繪圖模型生成的點陣插畫，保留白髮髮髻與紫衣、柔和頭巾。頭巾沿用既有角色設定，不推定移工的宗教或一致穿著。",
    ],
  };
  function stop() {
    clearTimeout(timer);
    $("#story-art")?.classList.remove("playing");
  }
  function finish() {
    stop();
    if ($("#story-status"))
      $("#story-status").textContent = "動作展示完成 · 全部文字保留";
  }
  function render(view) {
    stop();
    currentView = view;
    ({ budget, results, final, news, story, characters })[view]();
    $("#round-label").textContent =
      view === "final"
        ? "第五屆 / 五屆"
        : view === "characters"
          ? "角色素材樣張"
          : "第三屆 / 五屆";
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === view)),
      );
    $("#annotation-title").textContent = meta[view][0];
    $("#annotation-text").textContent = meta[view][1];
    main.scrollTop = 0;
  }
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.view) {
      render(b.dataset.view);
      return;
    }
    if (b.dataset.detail) {
      const d = $(`#detail-${b.dataset.detail}`);
      d.hidden = !d.hidden;
      b.setAttribute("aria-expanded", String(!d.hidden));
      return;
    }
    if (b.dataset.add) {
      const id = b.dataset.add;
      selected.has(id) ? selected.delete(id) : selected.add(id);
      b.setAttribute("aria-pressed", String(selected.has(id)));
      b.textContent = selected.has(id) ? "已加入 ✓" : "加入政見 ＋";
      b.closest(".policy").classList.toggle("selected", selected.has(id));
      $("#selected-count").textContent = `已選 ${selected.size} 張`;
      return;
    }
    if (b.dataset.action === "play") {
      stop();
      if (motion.matches || $("#reduce-motion").checked) {
        finish();
        return;
      }
      $("#story-art").classList.add("playing");
      $("#story-status").textContent = "動作展示中 · 可隨時略過";
      timer = setTimeout(finish, 2400);
      return;
    }
    if (b.dataset.action === "skip") {
      finish();
      return;
    }
    if (b.dataset.action === "characters") {
      render("story");
      return;
    }
    if (b.dataset.action) notify("此為畫面樣稿；未執行遊戲操作、計分或寄信。");
  });
  document.addEventListener("change", (event) => {
    const e = event.target;
    if (e.id === "reduce-motion" && e.checked) finish();
    if (e.dataset.toggleLayer) {
      for (const key of ["layer", "marker", "legend"])
        $(`[data-${key}="${e.dataset.toggleLayer}"]`).hidden = !e.checked;
      $(".empty-legend").hidden = !!document.querySelector(
        "[data-layer]:not([hidden])",
      );
    }
    if (e.id === "layer-mode") {
      document
        .querySelectorAll("[data-layer]")
        .forEach((l) =>
          l.classList.toggle("preview-layer", e.value === "preview"),
        );
      $("#layer-caption").textContent =
        e.value === "preview"
          ? "提案預覽樣式：淡色僅供預覽，尚未實施。"
          : "實施圖層樣式示範；尚無真實政策紀錄。";
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && currentView === "story") finish();
  });
  motion.addEventListener("change", () => {
    if (motion.matches) finish();
  });
  const params = new URLSearchParams(location.search);
  if (params.get("capture") === "1") document.body.classList.add("capture");
  render(
    Object.hasOwn(meta, params.get("screen")) ? params.get("screen") : "budget",
  );
})();
