
  /* ---------------- generate ---------------- */
  $("#lnkGen").addEventListener("click", function () { openGenerate("prompt"); });
  var genTab = "prompt";

  function genContent(tab) {
    var p = active();
    if (tab === "brief") return buildBrief(p);
    if (tab === "json") return JSON.stringify(jsonPayload(p), null, 2);
    return buildPrompt(p);
  }

  function renderGenerate() {
    if ($("#genModal").hidden) return;
    var p = active();
    var text = genContent(genTab);
    $("#genOut").innerHTML = genTab === "json" ? esc(text) : mdToHtml(text);
    $all("[data-gentab]").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-gentab") === genTab));
    });

    var c = completeness(p);
    var warn = $("#genWarn");
    warn.hidden = false;
    warn.classList.toggle("ok", !c.missing.length);
    warn.textContent = c.missing.length
      ? c.pct + "% terisi · " + c.missing.length + " bagian wajib masih kosong (" + c.missing.slice(0, 3).map(function (m) { return m.label; }).join(", ") + "). Prompt tetap jalan: AI mengambil keputusan wajar dan menandainya [ASUMSI]."
      : "Brief lengkap " + c.pct + "%. Prompt memuat mode eksekusi maksimal: langsung dibangun sampai jadi, tanpa potong kode.";

    $("#genMeta").textContent = text.length.toLocaleString("id-ID") + " karakter · siap tempel";
  }

  function openGenerate(tab) {
    if (tab) genTab = tab;
    // tampilkan dulu — renderGenerate() keluar lebih awal kalau modal masih hidden
    $("#genModal").hidden = false;
    document.body.style.overflow = "hidden";
    renderGenerate();
    setTimeout(function () { $("#genClose").focus(); }, 20);
  }

  function closeGenerate() {
    $("#genModal").hidden = true;
    document.body.style.overflow = "";
    $("#btnGenerate").focus();
  }

  $("#btnGenerate").addEventListener("click", function () { openGenerate("prompt"); });
  $all("[data-close-gen]").forEach(function (el) { el.addEventListener("click", closeGenerate); });
  $all("[data-gentab]").forEach(function (btn) {
    btn.addEventListener("click", function () { genTab = btn.getAttribute("data-gentab"); renderGenerate(); });
  });

  function copyText(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
    } else { legacyCopy(text, done); }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "-1000px"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (ok) done(); else toast("Gagal menyalin — pakai tombol .md");
  }

  $("#genCopy").addEventListener("click", function () {
    var msg = genTab === "prompt" ? "Prompt disalin — tempel ke AI" : genTab === "brief" ? "Brief disalin" : "JSON disalin";
    copyText(genContent(genTab), msg);
  });

  $("#genDownload").addEventListener("click", function () {
    var base = slugify(active().title);
    if (genTab === "json") { download(base + ".json", genContent("json"), "application/json;charset=utf-8"); toast("File diunduh"); }
    else if (genTab === "brief") { download(base + ".md", genContent("brief"), "text/markdown;charset=utf-8"); toast("File diunduh"); }
    else { download(base + "-prompt.md", genContent("prompt"), "text/markdown;charset=utf-8"); toast("Prompt diunduh"); }
  });

  document.addEventListener("keydown", function (ev) {
    if ($("#genModal").hidden) return;
    if (ev.key === "Escape") { ev.preventDefault(); closeGenerate(); return; }
    if (ev.key !== "Tab") return;
    var f = $all("#genModal button, #genModal [tabindex='0']").filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });
