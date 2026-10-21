/* ===== PRD Builder — inti aplikasi ===== */

  var STORAGE_KEY = "prd-builder-v1";
  var uid = function () { return Math.random().toString(36).slice(2, 9); };

  var REPEATERS = {
    goals:        { label: "Tambah tujuan",   placeholder: "Pengguna bisa ..." },
    nonGoals:     { label: "Tambah batas",    placeholder: "Tidak perlu ..." },
    antiGoals:    { label: "Tambah anti-goal", placeholder: "Gagal kalau ..." },
    flow:         { label: "Tambah langkah",  placeholder: "Langkah berikutnya ..." },
    acceptance:   { label: "Tambah kriteria", placeholder: "Bisa diuji: ..." },
    openQuestions:{ label: "Tambah pertanyaan", placeholder: "Belum diputuskan: ..." }
  };

  var FEAT_PRIO = ["Wajib", "Sebaiknya", "Boleh nanti"];

  function blankPRD(withSample) {
    var p = {
      id: uid(), title: "", oneLiner: "", problem: "", user: "", whyNow: "", metric: "",
      goals: [], nonGoals: [], antiGoals: [], features: [], flow: [], acceptance: [],
      constraints: "", openQuestions: [], extra: "", updatedAt: Date.now()
    };
    if (withSample) return Object.assign(p, samplePRD());
    return p;
  }

  function samplePRD() {
    return {
      title: "Ekspor rekap tiket ke Excel",
      oneLiner: "Tim lapangan bisa mengunduh rekap tiket mingguan sendiri sebagai .xlsx, tanpa menunggu admin.",
      problem: "Setiap Senin pagi admin merangkum sekitar 40 tiket dari 3 sheet manual, butuh 2 jam. Bulan lalu ada 2 salah hitung yang bikin laporan telat ke manajemen.",
      user: "Teknisi lapangan (3 orang) di kantor, pakai laptop Chrome. Admin (1 orang) memakainya untuk verifikasi akhir setiap Senin.",
      whyNow: "Laporan mingguan sekarang diminta jam 09.00, dan admin sedang cuti 2 minggu mulai bulan depan.",
      metric: "Rekap mingguan selesai di bawah 10 menit, tanpa bantuan admin, dan nol salah hitung dalam sebulan.",
      goals: [
        "Teknisi bisa memilih rentang tanggal lalu mengunduh .xlsx sendiri.",
        "Isi file sama persis dengan rekap manual yang selama ini dipakai."
      ],
      nonGoals: ["Belum perlu penjadwalan otomatis (kirim email tiap Senin).", "Belum perlu grafik atau dashboard baru."],
      antiGoals: ["Gagal kalau unduhan butuh lebih dari 3 klik.", "Gagal kalau data pelanggan ikut masuk ke file."],
      features: [
        { id: uid(), name: "Pilih rentang tanggal", desc: "Default minggu berjalan; bisa diganti bebas maksimal 90 hari.", prio: "Wajib" },
        { id: uid(), name: "Unduh .xlsx", desc: "Satu sheet, kolom sama dengan template manual, nama file memuat rentang tanggal.", prio: "Wajib" },
        { id: uid(), name: "Penanda status", desc: "Baris tiket yang masih terbuka diberi warna kuning lembut.", prio: "Sebaiknya" },
        { id: uid(), name: "Riwayat unduhan", desc: "Daftar siapa mengunduh apa dan kapan.", prio: "Boleh nanti" }
      ],
      flow: [
        "Teknisi membuka tab Laporan, memilih rentang tanggal.",
        "Klik Unduh, muncul progres sebentar.",
        "File .xlsx terunduh dan bisa dibuka di Excel/Sheets."
      ],
      acceptance: [
        "File .xlsx terunduh di bawah 3 detik untuk 500 tiket.",
        "Jumlah baris dan total jam cocok dengan rekap manual untuk minggu yang sama.",
        "Tidak ada kolom nomor telepon atau alamat pelanggan di file.",
        "Pilihan tanggal di luar 90 hari menampilkan pesan jelas, bukan error kosong."
      ],
      constraints: "Aplikasi tiket yang ada: Node + SQLite, satu halaman HTML. Jangan tambah dependency baru; pakai library yang sudah terpasang. Data pelanggan tidak boleh keluar dari server sendiri.",
      openQuestions: [
        "Format tanggal yang dipakai: dd/mm/yyyy atau yyyy-mm-dd?",
        "Apakah admin tetap perlu tanda tangan verifikasi, atau unduhan teknisi dianggap final?"
      ],
      extra: "Template manual terakhir ada di sheet 'rekap-2026-09'. Admin lebih suka kolom berurutan: tanggal, tiket, teknisi, jam, status."
    };
  }

  /* ---------------- state ---------------- */
  var state = { prds: [], activeId: null };
  var query = "";

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.prds) && parsed.prds.length) {
          state.prds = parsed.prds.map(normalizePRD);
          state.activeId = parsed.activeId && findPRD(parsed.activeId) ? parsed.activeId : state.prds[0].id;
          return;
        }
      }
    } catch (e) { /* storage unavailable */ }
    var seed = blankPRD(true);
    state.prds = [seed];
    state.activeId = seed.id;
    save();
  }

  function normalizePRD(p) {
    var base = blankPRD(false);
    base.id = p.id || uid();
    ["title","oneLiner","problem","user","whyNow","metric","constraints","extra"].forEach(function (k) {
      base[k] = typeof p[k] === "string" ? p[k] : "";
    });
    ["goals","nonGoals","antiGoals","flow","acceptance","openQuestions"].forEach(function (k) {
      base[k] = Array.isArray(p[k]) ? p[k].filter(function (v) { return typeof v === "string"; }) : [];
    });
    base.features = Array.isArray(p.features) ? p.features.map(function (f) {
      return {
        id: f && f.id ? f.id : uid(),
        name: f && typeof f.name === "string" ? f.name : "",
        desc: f && typeof f.desc === "string" ? f.desc : "",
        prio: f && FEAT_PRIO.indexOf(f.prio) > -1 ? f.prio : "Wajib"
      };
    }) : [];
    base.updatedAt = typeof p.updatedAt === "number" ? p.updatedAt : Date.now();
    return base;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ prds: state.prds, activeId: state.activeId })); } catch (e) {}
  }
  function findPRD(id) {
    for (var i = 0; i < state.prds.length; i++) if (state.prds[i].id === id) return state.prds[i];
    return null;
  }
  function active() { return findPRD(state.activeId) || state.prds[0]; }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    $("#toastText").textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2000);
  }

  function fmtDate(ts) {
    try { return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(ts)); }
    catch (e) { return new Date(ts).toDateString(); }
  }
  function relTime(ts) {
    var diff = Date.now() - ts;
    if (diff < 60000) return "baru saja";
    if (diff < 3600000) return Math.round(diff / 60000) + " menit lalu";
    if (diff < 86400000) return Math.round(diff / 3600000) + " jam lalu";
    return fmtDate(ts);
  }
