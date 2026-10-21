
  /* ---------------- rail ---------------- */
  function renderRail() {
    var list = $("#prdList");
    var items = state.prds.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    if (query.trim()) {
      var q = query.toLowerCase();
      items = items.filter(function (p) {
        return (p.title || "").toLowerCase().indexOf(q) > -1 || (p.oneLiner || "").toLowerCase().indexOf(q) > -1;
      });
    }
    $("#prdCount").textContent = state.prds.length + " dokumen";

    if (!items.length) {
      list.innerHTML = '<div class="prd-empty">Belum ada PRD yang cocok.<br />Coba kata kunci lain atau bikin baru.</div>';
      return;
    }
    list.innerHTML = items.map(function (p) {
      var title = (p.title || "").trim() || "PRD tanpa judul";
      var score = completeness(p).pct;
      return '<div class="prd-item" role="listitem" data-open="' + esc(p.id) + '" tabindex="0" aria-current="' + (p.id === state.activeId) + '">' +
        '<div class="pi-body">' +
          '<div class="pi-title">' + esc(title) + '</div>' +
          '<div class="pi-meta">' + score + '% · ' + esc(relTime(p.updatedAt)) + '</div>' +
        '</div>' +
        '<button class="pi-del" type="button" data-del-prd="' + esc(p.id) + '" aria-label="Hapus ' + esc(title) + '">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");

    $all(".prd-item", list).forEach(function (el) {
      el.addEventListener("click", function (ev) {
        if (ev.target.closest("[data-del-prd]")) return;
        switchPRD(el.getAttribute("data-open"));
      });
      el.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); switchPRD(el.getAttribute("data-open")); }
      });
    });
    $all("[data-del-prd]", list).forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        removePRD(btn.getAttribute("data-del-prd"));
      });
    });
  }

  function switchPRD(id) {
    if (!findPRD(id)) return;
    state.activeId = id;
    save();
    renderAll();
    if (window.matchMedia("(max-width:1140px)").matches) setView("write");
  }

  function removePRD(id) {
    var p = findPRD(id);
    if (!p) return;
    var name = (p.title || "PRD tanpa judul");
    if (!window.confirm('Hapus "' + name + '"? Tindakan ini tidak bisa dibatalkan.')) return;
    state.prds = state.prds.filter(function (x) { return x.id !== id; });
    if (state.activeId === id) {
      if (state.prds.length) state.activeId = state.prds[0].id;
      else { var fresh = blankPRD(false); state.prds = [fresh]; state.activeId = fresh.id; }
    }
    save(); renderAll(); toast("PRD dihapus");
  }

  /* ---------------- repeaters ---------------- */
  function renderRepeaters(p) {
    Object.keys(REPEATERS).forEach(function (key) {
      var host = document.querySelector('[data-rep="' + key + '"]');
      if (!host) return;
      var cfg = REPEATERS[key];
      var rows = p[key].map(function (val, i) {
        return '<div class="rep-row">' +
          '<span class="rk">' + (i + 1) + '</span>' +
          '<input type="text" data-list="' + key + '" data-idx="' + i + '" value="' + esc(val) + '" placeholder="' + esc(cfg.placeholder) + '" aria-label="' + esc(cfg.label) + ' ' + (i + 1) + '" />' +
          '<button class="del" type="button" data-del-row="' + key + '" data-idx="' + i + '" aria-label="Hapus baris ' + (i + 1) + '">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</div>';
      }).join("");
      host.innerHTML = '<div class="rep-rows">' + rows + '</div>' +
        '<button class="add" type="button" data-add-row="' + key + '">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
          esc(cfg.label) +
        '</button>';
    });
  }

  function renderFeatures(p) {
    var host = $("#featRows");
    if (!p.features.length) {
      host.innerHTML = '<div class="prd-empty" style="background:rgba(246,250,255,.7)">Belum ada fitur. Klik <b>+ Fitur</b> untuk mulai dari yang paling wajib.</div>';
      return;
    }
    host.innerHTML = p.features.map(function (f, i) {
      return '<div class="feat">' +
        '<input class="f-name" type="text" data-feat="name" data-fidx="' + i + '" value="' + esc(f.name) + '" placeholder="Nama fitur" aria-label="Nama fitur ' + (i + 1) + '" />' +
        '<input class="f-desc" type="text" data-feat="desc" data-fidx="' + i + '" value="' + esc(f.desc) + '" placeholder="Perilaku yang diharapkan" aria-label="Perilaku fitur ' + (i + 1) + '" />' +
        '<div class="prio"><select data-feat="prio" data-fidx="' + i + '" aria-label="Prioritas fitur ' + (i + 1) + '">' +
          FEAT_PRIO.map(function (pr) { return '<option value="' + pr + '"' + (f.prio === pr ? " selected" : "") + '>' + pr + '</option>'; }).join("") +
        '</select></div>' +
        '<button class="del" type="button" data-del-feat="' + i + '" aria-label="Hapus fitur ' + (i + 1) + '">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");
  }

  function fillEditor(p) {
    $all("[data-field]").forEach(function (el) {
      var k = el.getAttribute("data-field");
      if (el.value !== (p[k] || "")) el.value = p[k] || "";
    });
    renderRepeaters(p);
    renderFeatures(p);
  }
