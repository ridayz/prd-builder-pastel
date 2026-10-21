
  /* ---------------- events ---------------- */
  document.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.matches("[data-field]")) { active()[t.getAttribute("data-field")] = t.value; refreshLive(); return; }
    if (t.matches("[data-list]")) {
      var key = t.getAttribute("data-list");
      active()[key][parseInt(t.getAttribute("data-idx"), 10)] = t.value;
      refreshLive();
      return;
    }
    if (t.matches("[data-feat]")) {
      var f = active().features[parseInt(t.getAttribute("data-fidx"), 10)];
      if (f) { f[t.getAttribute("data-feat")] = t.value; refreshLive(); }
    }
  });

  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (!t.matches("[data-feat]")) return;
    var f = active().features[parseInt(t.getAttribute("data-fidx"), 10)];
    if (f) { f[t.getAttribute("data-feat")] = t.value; refreshLive(); }
  });

  document.addEventListener("click", function (ev) {
    var addRow = ev.target.closest("[data-add-row]");
    if (addRow) {
      var key = addRow.getAttribute("data-add-row");
      active()[key].push("");
      save(); fillEditor(active()); refreshLive();
      var rows = document.querySelectorAll('[data-list="' + key + '"]');
      if (rows.length) rows[rows.length - 1].focus();
      return;
    }
    var delRow = ev.target.closest("[data-del-row]");
    if (delRow) {
      var k2 = delRow.getAttribute("data-del-row");
      active()[k2].splice(parseInt(delRow.getAttribute("data-idx"), 10), 1);
      save(); fillEditor(active()); refreshLive();
      return;
    }
    var delFeat = ev.target.closest("[data-del-feat]");
    if (delFeat) {
      active().features.splice(parseInt(delFeat.getAttribute("data-del-feat"), 10), 1);
      save(); fillEditor(active()); refreshLive();
    }
  });

  $("#btnAddFeat").addEventListener("click", function () {
    active().features.push({ id: uid(), name: "", desc: "", prio: "Wajib" });
    save(); fillEditor(active()); refreshLive();
    var inputs = document.querySelectorAll('[data-feat="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  $("#searchInput").addEventListener("input", function (ev) { query = ev.target.value; renderRail(); });

  $("#btnNew").addEventListener("click", function () {
    var p = blankPRD(false);
    state.prds.unshift(p);
    state.activeId = p.id;
    save(); renderAll();
    $("#fTitle").focus();
    toast("PRD baru dibuat");
  });

  $("#btnExample").addEventListener("click", function () {
    var p = blankPRD(true);
    p.title = p.title + " (contoh)";
    state.prds.unshift(p);
    state.activeId = p.id;
    save(); renderAll();
    toast("Contoh PRD dimuat");
  });

  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function slugify(s) {
    return (s || "prd").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "prd";
  }

  $("#btnMd").addEventListener("click", function () {
    var p = active();
    download(slugify(p.title) + ".md", buildBrief(p), "text/markdown;charset=utf-8");
    toast("File .md diunduh");
  });

  $("#btnJson").addEventListener("click", function () {
    var p = active();
    download(slugify(p.title) + ".json", JSON.stringify(jsonPayload(p), null, 2), "application/json;charset=utf-8");
    toast("File .json diunduh");
  });

  /* view tabs (mobile) */
  function setView(v) {
    document.body.setAttribute("data-view", v);
    $("#tabWrite").setAttribute("aria-selected", String(v === "write"));
    $("#tabBrief").setAttribute("aria-selected", String(v === "brief"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("#tabWrite").addEventListener("click", function () { setView("write"); });
  $("#tabBrief").addEventListener("click", function () { setView("brief"); });

  document.addEventListener("keydown", function (ev) {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    var k = ev.key.toLowerCase();
    if (k === "s") {
      ev.preventDefault();
      download(slugify(active().title) + ".md", buildBrief(active()), "text/markdown;charset=utf-8");
      toast("File .md diunduh");
    }
    if (k === "k") { ev.preventDefault(); $("#searchInput").focus(); }
    if (ev.shiftKey && k === "c") { ev.preventDefault(); copyText(buildPrompt(active()), "Prompt disalin — tempel ke AI"); }
    if (ev.key === "Enter") { ev.preventDefault(); openGenerate("prompt"); }
  });

  /* boot */
  load();
  renderAll();
  if (window.matchMedia("(max-width:1140px)").matches) setView("write");
</script>
