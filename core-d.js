
  /* ---------------- rendering ---------------- */
  function mdToHtml(md) {
    return esc(md)
      .replace(/^### (.*)$/gm, '<span class="h2">### $1</span>')
      .replace(/^## (.*)$/gm, '<span class="h2">## $1</span>')
      .replace(/^# (.*)$/gm, '<span class="h1"># $1</span>')
      .replace(/^&gt; (.*)$/gm, '<span class="q">&gt; $1</span>')
      .replace(/(`prd\/v1`[^\n]*)/g, '<span class="meta">$1</span>');
  }

  function renderBrief(p) {
    var md = buildBrief(p);
    $("#mdOut").innerHTML = mdToHtml(md);
    $("#charCount").textContent = md.length.toLocaleString("id-ID") + " karakter";
  }

  function openDetail() {
    var d = document.getElementById("secDetail");
    if (!d) return;
    d.open = true;
    if (window.matchMedia("(max-width:1140px)").matches) setView("write");
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderChecks(p) {
    var c = completeness(p);
    $("#pctText").textContent = c.pct + "%";
    var circ = 2 * Math.PI * 14;
    var arc = $("#ringArc");
    arc.setAttribute("stroke-dasharray", circ.toFixed(1));
    arc.setAttribute("stroke-dashoffset", (circ * (1 - c.pct / 100)).toFixed(1));
    arc.setAttribute("stroke", c.pct >= 90 ? "#3fa88b" : c.pct >= 60 ? "#4d84e8" : "#c98a24");

    $("#checkCount").textContent = c.passed + " / " + c.total;
    $("#checkBar").style.width = c.pct + "%";
    $("#checkBar").style.background = c.pct >= 90 ? "linear-gradient(90deg,#7fd8bb,#3fa88b)" : "linear-gradient(90deg,#7fb0f2,#4d84e8)";

    $("#detailCount").textContent = c.optional + "/" + c.optionalTotal;
    var opt = $("#optLine");
    if (c.optional >= c.optionalTotal) {
      opt.innerHTML = "<span>Detail opsional terisi semua.</span>";
    } else {
      opt.innerHTML = '<button type="button" id="optOpen">Detail opsional ' + c.optional + "/" + c.optionalTotal + '</button> <span>— boleh dibiarkan.</span>';
      var ob = $("#optOpen");
      if (ob) ob.addEventListener("click", openDetail);
    }

    var host = $("#missList");
    if (!c.missing.length) {
      host.innerHTML = '<li><div class="allgood">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
        'Semua bagian wajib terisi. Brief siap dikirim.</div></li>';
      return;
    }
    host.innerHTML = c.missing.map(function (m) {
      var jump = m.id || m.target;
      return '<li><button type="button" data-jump="' + jump + '">' +
        '<svg class="ic" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>' +
        '<span>' + esc(m.label) + '</span></button></li>';
    }).join("");

    $all("[data-jump]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var el = document.getElementById(btn.getAttribute("data-jump"));
        if (!el) return;
        if (window.matchMedia("(max-width:1140px)").matches) setView("write");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        var focusable = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) ? el : el.querySelector('input[type="text"], textarea, select');
        setTimeout(function () { (focusable || el).focus({ preventScroll: true }); }, 240);
      });
    });
  }

  function renderAll() {
    var p = active();
    renderRail();
    fillEditor(p);
    renderBrief(p);
    renderChecks(p);
  }

  function refreshLive() {
    var p = active();
    p.updatedAt = Date.now();
    save();
    renderBrief(p);
    renderChecks(p);
    renderRail();
  }
