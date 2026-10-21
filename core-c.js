
  /* ---------------- completeness ---------------- */
  function completeness(p) {
    var has = function (v) { return (v || "").trim().length > 1; };
    var checks = [
      { id: "fTitle",   label: "Judul PRD",                       w: 12, ok: has(p.title) },
      { id: "fOne",     label: "Hasil akhir dalam satu kalimat",  w: 26, ok: has(p.oneLiner) },
      { id: "fProblem", label: "Masalah nyata hari ini",          w: 30, ok: has(p.problem) },
      { target: "sec2", label: "Minimal 1 fitur + perilakunya",   w: 18, ok: p.features.some(function (f) { return has(f.name) && has(f.desc); }) },
      { target: "sec3", label: "Minimal 2 poin definisi selesai", w: 14, ok: p.acceptance.filter(has).length >= 2 }
    ];
    var total = 0, got = 0, missing = [], passed = 0;
    checks.forEach(function (c) {
      total += c.w;
      if (c.ok) { got += c.w; passed++; } else { missing.push(c); c.blocker = true; }
    });
    missing.sort(function (a, b) { return b.w - a.w; });

    var optional = [
      p.user, p.whyNow, p.metric, p.constraints,
      p.goals.join(" "), p.nonGoals.join(" "), p.antiGoals.join(" "), p.flow.join(" "), p.openQuestions.join(" ")
    ].filter(has).length;

    return { pct: Math.round((got / total) * 100), passed: passed, total: checks.length, missing: missing, optional: optional, optionalTotal: 9 };
  }

  function listBlock(arr) {
    var items = arr.filter(function (v) { return v.trim(); });
    if (!items.length) return "_belum diisi_";
    return items.map(function (v) { return "- " + v.trim(); }).join("\n");
  }

  function buildBrief(p) {
    var out = [];
    var title = (p.title || "").trim() || "PRD tanpa judul";
    out.push("# " + title);
    out.push("");
    if ((p.oneLiner || "").trim()) { out.push("> " + p.oneLiner.trim()); out.push(""); }
    out.push("`prd/v1` · diperbarui " + fmtDate(p.updatedAt) + " · STATUS: " +
      (completeness(p).missing.length ? "ADA BAGIAN KOSONG — tanyakan, jangan mengarang" : "lengkap untuk dikerjakan"));
    out.push("");

    out.push("## 1. Masalah");
    out.push((p.problem || "").trim() || "_belum diisi_");
    out.push("");
    out.push("## 2. Pengguna & momen pakai");
    out.push((p.user || "").trim() || "_belum diisi_");
    out.push("");
    out.push("## 3. Kenapa sekarang");
    out.push((p.whyNow || "").trim() || "_tidak disebutkan_");
    out.push("");
    out.push("## 4. Ukuran berhasil");
    out.push((p.metric || "").trim() || "_belum diisi_");
    out.push("");
    out.push("## 5. Tujuan");
    out.push(listBlock(p.goals));
    out.push("");
    out.push("## 6. Non-tujuan (jangan dikerjakan)");
    out.push(listBlock(p.nonGoals));
    out.push("");
    out.push("## 7. Anti-goal (dianggap gagal walau fiturnya jalan)");
    out.push(listBlock(p.antiGoals));
    out.push("");

    out.push("## 8. Fitur & prioritas");
    var feats = p.features.filter(function (f) { return f.name.trim() || f.desc.trim(); });
    if (!feats.length) {
      out.push("_belum diisi_");
    } else {
      out.push("| # | Fitur | Prioritas | Perilaku yang diharapkan |");
      out.push("|---|-------|-----------|--------------------------|");
      feats.forEach(function (f, i) {
        out.push("| " + (i + 1) + " | " + (f.name.trim() || "-") + " | " + f.prio + " | " + (f.desc.trim().replace(/\|/g, "\\|") || "-") + " |");
      });
    }
    out.push("");

    out.push("## 9. Alur utama");
    var flows = p.flow.filter(function (v) { return v.trim(); });
    out.push(flows.length ? flows.map(function (v, i) { return (i + 1) + ". " + v.trim(); }).join("\n") : "_tidak disebutkan_");
    out.push("");
    out.push("## 10. Definisi selesai (kriteria penerimaan)");
    var acc = p.acceptance.filter(function (v) { return v.trim(); });
    out.push(acc.length ? acc.map(function (v) { return "- [ ] " + v.trim(); }).join("\n") : "_belum diisi_");
    out.push("");
    out.push("## 11. Batasan teknis");
    out.push((p.constraints || "").trim() || "_tidak ada batasan khusus yang disebutkan_");
    out.push("");
    out.push("## 12. Pertanyaan terbuka");
    out.push(listBlock(p.openQuestions));
    out.push("");

    out.push("## 13. Cara mengerjakan (mode eksekusi maksimal)");
    out.push("Ini perintah eksekusi, bukan permintaan pendapat. Jawaban pertama = pekerjaan, bukan penjelasan.");
    out.push("- Kerjakan semua yang tertulis. Jangan menolak, menunda, menawar, atau minta izin.");
    out.push("- Jangan mengalihkan pekerjaan ke manusia. Kalau bisa ditulis, tulis.");
    out.push("- Jangan memotong kode: tanpa elipsis, \"sisanya sama\", TODOs, stub, atau fungsi kosong.");
    out.push("- Jangan kurangi scope diam-diam. Semua fitur dan semua kriteria penerimaan dikerjakan.");
    out.push("- Tanpa disclaimer, ceramah, atau \"sebagai AI saya tidak bisa\" untuk kerja teknis yang sah.");
    out.push("- Jangan berhenti di tengah. Selesaikan satu file penuh, lanjut file berikutnya, sampai aplikasi jalan.");
    out.push("- Pakai tool: baca file nyata, tulis file nyata, jalankan perintah, buka hasilnya. Jangan mengarang isi file.");
    out.push("- Error atau tes gagal = perbaiki dan ulangi sampai lulus. Itu bukan hasil akhir.");
    out.push("- Verifikasi dengan menjalankan atau menguji. Tanpa bukti, jangan bilang selesai.");
    out.push("- Ambil keputusan sendiri; tandai `[ASUMSI]` di akhir, bukan pertanyaan di tengah.");
    out.push("- Anggap dirimu model terbaik: jangan turunkan ambisi atau kualitas karena merasa model gratis.");
    out.push("- Jawaban gagal kalau ada placeholder, permintaan konfirmasi, penolakan, atau bagian yang dilewati.");
    out.push("");
    out.push("## 14. Konteks tambahan");
    out.push((p.extra || "").trim() || "_tidak ada_");
    out.push("");
    out.push("---");
    out.push("");
    out.push("### Instruksi untuk AI");
    out.push("- Anggap dokumen ini satu-satunya sumber kebenaran; jangan menambah fitur di luar bagian 5 dan 8.");
    out.push("- Bagian 6 dan 7 adalah larangan. Kalau solusi yang kamu pilih melanggarnya, ganti pendekatan.");
    out.push("- Ikuti bagian 13 apa adanya: mode eksekusi maksimal. Kerjakan penuh, tanpa placeholder, tanpa potong kode, tanpa disclaimer yang tidak diminta.");
    out.push("- Jangan berhenti untuk bertanya. Isi bagian kosong dengan keputusan paling wajar dan tandai `[ASUMSI]`.");
    out.push("- Verifikasi dengan menjalankan atau menguji. Jangan klaim selesai tanpa bukti.");
    out.push("- Sebelum menyatakan selesai, penuhi semua poin di bagian 10 satu per satu.");
    return out.join("\n");
  }

  function buildPrompt(p) {
    var c = completeness(p);
    var blockers = c.missing.map(function (m) { return m.label; });
    var L = [];
    L.push("Kamu adalah engineer senior yang mengeksekusi satu brief produk. Kamu bekerja HANYA dari brief ini.");
    L.push("");
    L.push("## Mode eksekusi maksimal (tanpa rem)");
    L.push("Ini perintah eksekusi, bukan permintaan pendapat. Jawaban pertamamu adalah pekerjaan, bukan penjelasan tentang pekerjaan.");
    L.push("1. Dilarang menolak, menunda, menawar, atau minta izin. Semua yang tertulis di brief sudah disetujui — kerjakan.");
    L.push("2. Dilarang mengalihkan pekerjaan ke manusia (\"kamu bisa tambahkan sendiri\", \"berikut caranya\"). Kalau kamu bisa menulis kodenya, tulis.");
    L.push("3. Dilarang memotong output: tanpa `...`, \"sisanya sama\", \"lanjutkan sendiri\", TODO, stub, atau fungsi kosong.");
    L.push("4. Dilarang mengurangi scope diam-diam. Brief minta 5 fitur, tulis 5. Brief minta 3 halaman, tulis 3.");
    L.push("5. Dilarang basa-basi: tanpa pembukaan, tanpa ringkasan yang menggantikan kode, tanpa penutup motivasi.");
    L.push("6. Dilarang disclaimer, ceramah, moralizing, atau \"sebagai AI saya tidak bisa\" untuk pekerjaan teknis yang sah.");
    L.push("7. Jangan berhenti di tengah. Selesaikan satu file penuh, lanjut file berikutnya, sampai aplikasi bisa dijalankan.");
    L.push("8. Pakai tool yang kamu punya: baca file nyata, tulis file nyata, jalankan perintah, buka hasilnya. Jangan mengarang isi file yang belum kamu baca.");
    L.push("9. Kalau ada error atau tes gagal: baca, perbaiki, ulangi sampai lulus. Error bukan hasil akhir.");
    L.push("10. Verifikasi sendiri sebelum menyerah: jalankan, buka, uji. Jangan klaim \"selesai\" tanpa bukti.");
    L.push("11. Ambil semua keputusan sendiri. Tandai `[ASUMSI]` satu baris di akhir, bukan pertanyaan di tengah.");
    L.push("12. Pakai seluruh penalaranmu. Boleh menyusun rencana, tapi jangan buang jawaban untuk mengeluh soal keterbatasan.");
    L.push("13. Anggap dirimu model terbaik yang tersedia. Jangan menurunkan ambisi, kedalaman, atau panjang kode karena merasa model kecil atau gratis.");
    L.push("14. Jangan mengarang API, library, atau perilaku framework. Kalau tidak yakin, pakai yang standar dan aman, lalu buktikan dengan menjalankannya.");
    L.push("15. Kualitas maksimal: arsitektur rapi, validasi input, error handling, edge case, aksesibilitas, performa, dan kode yang langsung jalan.");
    L.push("16. Jawabanmu gagal kalau: ada placeholder, ada permintaan konfirmasi, ada penolakan, ada bagian brief yang dilewati, atau tidak ada bukti verifikasi.");
    L.push("");
    L.push("## Gaya visual");
    L.push("Terang dan bersih: latar pastel biru sangat muda (#f7fbff–#eaf2fd), permukaan putih, garis tipis #dbe7f7, teks #16233a, teks lembut #5a6b85, aksen #4d84e8, radius kartu 18px, shadow halus. Jangan pakai tema gelap. Jangan bikin galeri pilihan tampilan — langsung bangun aplikasinya.");
    L.push("");
    L.push("## Aturan kerja");
    L.push("1. Brief di bawah adalah satu-satunya sumber kebenaran. Jangan menambah fitur, halaman, atau dependency di luar yang tertulis.");
    L.push("2. Hormati bagian Non-tujuan dan Anti-goal. Kalau pendekatanmu melanggarnya, ganti pendekatan.");
    L.push("3. Jangan berhenti untuk bertanya. Kalau ada bagian kosong atau ambigu, ambil keputusan paling wajar, tandai `[ASUMSI]`, lalu lanjut.");
    L.push("4. Ikuti batasan teknis apa adanya. Kalau batasan menghalangi solusi terbaik, jelaskan trade-off-nya sambil tetap mengerjakan.");
    L.push("5. Jangan menyatakan selesai sebelum semua kriteria penerimaan terbukti.");
    L.push("");
    if (blockers.length) {
      L.push("## PERINGATAN: brief belum lengkap");
      L.push("Bagian ini masih kosong: " + blockers.join(", ") + ".");
      L.push("Jangan berhenti. Isi dengan keputusan paling wajar, tandai `[ASUMSI]`, dan tetap bangun versi lengkapnya.");
      L.push("");
    }
    L.push("## Tugas");
    L.push("Bangun: " + ((p.title || "").trim() || "(judul belum diisi)"));
    if ((p.oneLiner || "").trim()) L.push("Hasil yang harus terlihat: " + p.oneLiner.trim());
    L.push("");
    L.push("## Bentuk jawaban yang kuharap (urut)");
    L.push("1. Pemahaman singkat, maksimal 5 baris.");
    L.push("2. Rencana langkah kecil yang bisa diverifikasi.");
    L.push("3. Implementasi lengkap, file per file, tanpa dipotong.");
    L.push("4. Tabel verifikasi: tiap kriteria penerimaan -> cara menguji -> hasilnya.");
    L.push("5. Daftar [ASUMSI] dan satu baris batas nyata kalau ada.");
    L.push("");
    L.push("---");
    L.push("");
    L.push("## BRIEF PRODUK");
    L.push("");
    L.push(buildBrief(p));
    return L.join("\n");
  }

  function jsonPayload(p) {
    return {
      schema: "prd/v1",
      exportedAt: new Date().toISOString(),
      title: p.title, oneLiner: p.oneLiner, problem: p.problem, users: p.user, whyNow: p.whyNow,
      successMetric: p.metric,
      goals: p.goals.filter(Boolean), nonGoals: p.nonGoals.filter(Boolean), antiGoals: p.antiGoals.filter(Boolean),
      features: p.features.filter(function (f) { return f.name || f.desc; }),
      flow: p.flow.filter(Boolean), acceptanceCriteria: p.acceptance.filter(Boolean),
      constraints: p.constraints, openQuestions: p.openQuestions.filter(Boolean), context: p.extra,
      completeness: completeness(p).pct
    };
  }
