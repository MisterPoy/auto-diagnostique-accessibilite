(function () {
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  const STORAGE_KEY = "gregdev_auto_diag_accessibilite_v3";
  const scoreText = document.getElementById("scoreText");
  const scoreLabel = document.getElementById("scoreLabel");
  const scoreMeta = document.getElementById("scoreMeta");
  const scoreDot = document.getElementById("scoreDot");
  const bar = document.getElementById("bar");
  const progress = document.getElementById("progress");
  const sectionsBreakdown = document.getElementById("sectionsBreakdown");
  const pageName = document.getElementById("pageName");
  const auditDate = document.getElementById("auditDate");
  const notes = document.getElementById("notes");
  const exportBtn = document.getElementById("exportBtn");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");
  const mdOut = document.getElementById("mdOut");
  const mdCloseBtn = document.getElementById("mdCloseBtn");
  const printSummary = document.getElementById("printSummary");
  // ✅ PATCH : uniquement les 20 questions (celles qui ont data-idx)
  function questionInputs() {
    return Array.from(
      document.querySelectorAll(
        "input.check-input[type=\"radio\"][name][data-answer]"
      )
    );
  }
  // ? PATCH : uniquement les 20 questions (oui)
  function questionYesInputs() {
    return Array.from(
      document.querySelectorAll(
        "input.check-input[type=\"radio\"][data-answer=\"yes\"][data-idx]"
      )
    );
  }
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      t.style.opacity = "0";
    }, 1600);
  }
  function scoreLevel(pct) {
    if (pct >= 80)
      return { label: "Solide", color: "#166534", dot: "#22c55e" };
    if (pct >= 55)
      return {
        label: "Bien (encore 2–3 quick wins)",
        color: "#92400e",
        dot: "#f59e0b",
      };
    return { label: "À renforcer", color: "#b91c1c", dot: "#ef4444" };
  }
  function sectionLevel(pct) {
    if (pct >= 80) return { dot: "#22c55e" };
    if (pct >= 55) return { dot: "#f59e0b" };
    return { dot: "#ef4444" };
  }
  function buildSectionMap() {
    const map = new Map();
    const boxes = questionYesInputs();
    boxes.forEach((cb) => {
      const sec = cb.getAttribute("data-section") || "Checklist";
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec).push(cb);
    });
    return map;
  }
  function computeSectionStats() {
    const groups = buildSectionMap();
    const stats = [];
    for (const [sec, items] of groups.entries()) {
      const total = items.length;
      const checked = items.filter((i) => i.checked).length;
      const pct = total ? Math.round((checked / total) * 100) : 0;
      const firstId = items[0]?.id;
      stats.push({ sec, total, checked, pct, firstId });
    }
    stats.sort((a, b) => a.sec.localeCompare(b.sec, "fr"));
    return stats;
  }
  function updateSectionScores() {
    if (!sectionsBreakdown) return;
    const stats = computeSectionStats();
    sectionsBreakdown.innerHTML = "";
    stats.forEach((s) => {
      const li = document.createElement("li");
      const el = document.createElement(s.firstId ? "a" : "span");
      if (s.firstId) {
        el.href = "#" + s.firstId;
        el.style.textDecoration = "none";
        el.style.color = "inherit";
      }
      el.className = "sec-pill";
      el.setAttribute(
        "aria-label",
        `${s.sec} : ${s.pct}% (${s.checked}/${s.total})`
      );
      const dot = document.createElement("span");
      dot.className = "mini-dot";
      dot.style.background = sectionLevel(s.pct).dot;
      const title = document.createElement("span");
      title.innerHTML = `<strong>${escapeHtml(s.sec)}</strong>`;
      const meta = document.createElement("span");
      meta.textContent = `${s.pct}% (${s.checked}/${s.total})`;
      el.appendChild(dot);
      el.appendChild(title);
      el.appendChild(meta);
      li.appendChild(el);
      sectionsBreakdown.appendChild(li);
    });
  }
  function computeGlobal() {
    const boxes = questionYesInputs();
    const total = boxes.length;
    const checked = boxes.filter((b) => b.checked).length;
    const pct = total ? Math.round((checked / total) * 100) : 0;
    return { total, checked, pct };
  }
  // ✅ PATCH : sync des 20 carrés finaux
  function syncFinalSquares() {
    const squares = Array.from(document.querySelectorAll(".final-sq"));
    if (squares.length === 0) return;
    questionYesInputs().forEach((input) => {
      const idx = input.getAttribute("data-idx");
      const sq = document.querySelector(`.final-sq[data-idx="${idx}"]`);
      if (!sq) return;
      sq.classList.toggle("is-on", input.checked);
    });
  }
  function updatePrintSummary() {
    if (!printSummary) return;
    const g = computeGlobal();
    const stats = computeSectionStats();
    const pn = (pageName?.value || "").trim();
    const ad = (auditDate?.value || "").trim();
    const nt = (notes?.value || "").trim();
    const rows = stats
      .map(
        (s) => `
      <tr>
        <td>${escapeHtml(s.sec)}</td>
        <td><strong>${s.pct}%</strong></td>
        <td>${s.checked}/${s.total}</td>
      </tr>
    `
      )
      .join("");
    printSummary.innerHTML = `
      <div class="print-summary">
        <h2>Résumé — Auto-diagnostic Accessibilité &amp; Clarté</h2>
        <div class="print-meta">
          <span class="print-pill">Score global : <strong>${g.checked}/${
      g.total
    }</strong> (${g.pct}%)</span>
          ${
            pn
              ? `<span class="print-pill">Page : <strong>${escapeHtml(
                  pn
                )}</strong></span>`
              : ``
          }
          ${
            ad
              ? `<span class="print-pill">Date : <strong>${escapeHtml(
                  ad
                )}</strong></span>`
              : ``
          }
        </div>
        <table class="print-table" aria-label="Scores par section">
          <thead>
            <tr><th>Section</th><th>Score</th><th>Cochés</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${
          nt
            ? `<div class="print-notes"><strong>Notes :</strong>\n${escapeHtml(
                nt
              )}</div>`
            : ``
        }
      </div>
    `;
  }
  function updateScore() {
    const { total, checked, pct } = computeGlobal();
    if (scoreText) scoreText.textContent = `${checked}/${total}`;
    document.querySelectorAll(".score-inline").forEach((el) => {
      el.textContent = `${checked}/${total}`;
    });
    if (scoreMeta)
      scoreMeta.textContent = `${checked}/${total} cases cochées — ${pct}%`;
    const lvl = scoreLevel(pct);
    if (scoreLabel) {
      scoreLabel.textContent = lvl.label;
      scoreLabel.style.color = lvl.color;
    }
    if (scoreDot) scoreDot.style.background = lvl.dot;
    if (bar) {
      bar.style.width = pct + "%";
      bar.style.background = lvl.dot;
    }
    if (progress) progress.setAttribute("aria-valuenow", String(pct));
    syncFinalSquares();
    updateSectionScores();
    updatePrintSummary();
  }
  function saveState() {
    const state = {};
    const groups = new Map();
    questionInputs().forEach((input) => {
      if (!groups.has(input.name)) groups.set(input.name, []);
      groups.get(input.name).push(input);
    });
    groups.forEach((inputs, name) => {
      const selected = inputs.find((input) => input.checked);
      state[name] = selected ? selected.getAttribute("data-answer") : "";
    });
    state.__pageName = pageName ? pageName.value : "";
    state.__auditDate = auditDate ? auditDate.value : "";
    state.__notes = notes ? notes.value : "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (auditDate)
          auditDate.value = new Date().toISOString().slice(0, 10);
        return;
      }
      const state = JSON.parse(raw);
      questionInputs().forEach((input) => {
        const saved = state[input.name];
        input.checked = saved === input.getAttribute("data-answer");
      });
      if (pageName) pageName.value = state.__pageName || "";
      if (notes) notes.value = state.__notes || "";
      if (auditDate)
        auditDate.value =
          state.__auditDate || new Date().toISOString().slice(0, 10);
    } catch (e) {
      if (auditDate)
        auditDate.value = new Date().toISOString().slice(0, 10);
    }
  }
  function groupBySection() {
    const map = new Map();
    questionYesInputs().forEach((cb) => {
      const sec = cb.getAttribute("data-section") || "Checklist";
      if (!map.has(sec)) map.set(sec, []);
      const label =
        cb
          .closest(".question-item")
          ?.querySelector(".question-text")
          ?.textContent?.replace(/\s+/g, " ")
          ?.trim() || cb.id;
      map.get(sec).push({ id: cb.id, label, checked: cb.checked });
    });
    return map;
  }
  function toTrelloMarkdown() {
    const boxes = questionYesInputs();
    const total = boxes.length;
    const checked = boxes.filter((b) => b.checked).length;
    const pct = total ? Math.round((checked / total) * 100) : 0;
    const pn = pageName?.value?.trim() || "Page non précisée";
    const ad = auditDate?.value || "";
    const nt = notes?.value?.trim() || "";
    const level = scoreLevel(pct);
    const badgeEmoji = pct >= 80 ? "🟢" : pct >= 55 ? "🟠" : "🔴";
    const stats = computeSectionStats();
    const groups = groupBySection();
    const weakest = [...stats].sort((a, b) => a.pct - b.pct).slice(0, 3);
    const lines = [];
    lines.push(`🧩 **Mini audit express — Accessibilité & clarté**`);
    lines.push(`**Page auditée :** ${pn}`);
    if (ad) lines.push(`**Date :** ${ad}`);
    lines.push(
      `**Score global :** ${badgeEmoji} **${checked}/${total}** — ${level.label} (${pct}%)`
    );
    lines.push("");
    lines.push(`—`);
    lines.push(`**GregDev — Gregory Poupaux**`);
    lines.push(`Développeur web front-end (UX & accessibilité)`);
    lines.push(
      `✉️ gregory.poupaux@hotmail.fr · 🔗 www.linkedin.com/in/grégory-poupaux`
    );
    lines.push(`—`);
    lines.push("");
    lines.push(`## ⚡ Constats rapides`);
    weakest.forEach((w) => {
      lines.push(
        `- **${w.sec}** : **${w.pct}%** (${w.checked}/${w.total})`
      );
    });
    lines.push("");
    if (nt) {
      lines.push(`## 🧠 Notes`);
      lines.push(nt);
      lines.push("");
    }
    lines.push(`## 📋 Détails (les 20 vérifications)`);
    const keys = Array.from(groups.keys()).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
    keys.forEach((sec) => {
      lines.push(`### ${sec}`);
      (groups.get(sec) || []).forEach((item) => {
        lines.push(`- [${item.checked ? "x" : " "}] ${item.label}`);
      });
      lines.push("");
    });
    return lines.join("\n");
  }
  function bind() {
    questionInputs().forEach((input) => {
      input.addEventListener("change", () => {
        saveState();
        updateScore();
      });
    });
    [pageName, auditDate, notes].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        saveState();
        updateScore();
      });
      el.addEventListener("change", () => {
        saveState();
        updateScore();
      });
    });
    function showMarkdown(md) {
      if (!mdOut) return;
      mdOut.value = md;
      mdOut.classList.remove("sr-only");
      mdOut.classList.add("md-output");
      if (mdCloseBtn) mdCloseBtn.classList.add("is-visible");
      mdOut.focus();
      mdOut.select();
    }
    function hideMarkdown() {
      if (!mdOut) return;
      mdOut.classList.remove("md-output");
      mdOut.classList.add("sr-only");
      if (mdCloseBtn) mdCloseBtn.classList.remove("is-visible");
    }
    if (mdCloseBtn) {
      mdCloseBtn.addEventListener("click", hideMarkdown);
    }
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const md = toTrelloMarkdown();
        showMarkdown(md);
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const md = toTrelloMarkdown();
        try {
          await navigator.clipboard.writeText(md);
          toast("Markdown copie.");
        } catch (e) {
          showMarkdown(md);
          toast("Copie manuelle : Ctrl+C");
        }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        questionInputs().forEach((input) => (input.checked = false));
        if (pageName) pageName.value = "";
        if (notes) notes.value = "";
        if (auditDate)
          auditDate.value = new Date().toISOString().slice(0, 10);
        saveState();
        updateScore();
        hideMarkdown();
        toast("Reinitialise");
      });
    }
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
    const exportMenu = document.getElementById("exportMenu");
    function isMobile() {
      return window.matchMedia("(max-width: 860px)").matches;
    }
    function syncExportMenu() {
      if (!exportMenu) return;
      exportMenu.open = !isMobile();
    }
    syncExportMenu();
    window.addEventListener("resize", syncExportMenu);
    // Ferme le menu apres une action (mobile)
    ["exportBtn", "copyBtn", "resetBtn", "printBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (exportMenu && isMobile()) exportMenu.open = false;
      });
    });
    window.addEventListener("beforeprint", updatePrintSummary);
  }
  loadState();
  bind();
  updateScore();
})();
