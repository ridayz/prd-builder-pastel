// build.js — rakit index.html dengan penanda yang eksplisit & diverifikasi.
// Struktur hasil:
//   <HTML head+body> ...
//   <script>        (function(){ "use strict"; ... core ... })();       </script>
//   </body></html>
const fs = require("fs");
const path = require("path");

const root = __dirname;
const file = path.join(root, "index.html");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n");
const block = (f) => "/* ===== " + f + " ===== */\n" + read(f).trim();

// ---------- 1. ambil HTML murni (sampai sebelum <script> pertama di body) ----------
const raw = read("index.html");
const bodyIdx = raw.indexOf("<body");
if (bodyIdx < 0) throw new Error("<body> tidak ditemukan");

// penanda akhir HTML: elemen toast penutup
const TOAST_END = '<span id="toastText">Tersalin</span>\n</div>';
const toastAt = raw.indexOf(TOAST_END);
if (toastAt < 0) throw new Error("penanda akhir HTML (toast) tidak ditemukan");
const htmlEnd = toastAt + TOAST_END.length;

// Teks HTML pernah melewati konversi encoding yang salah (UTF-8 dibaca sebagai
// Windows-1252), jadi em dash dan elipsis berubah jadi "Ã¢â‚¬â€¦". Bersihkan di
// sini supaya hasil build selalu rapi, bukan mengandalkan isi file mentah.
const cleanHead = (s) => s
  .replace(/[\u0080-\u009F]/g, "")
  .replace(/<title>[\s\S]*?<\/title>/i, "<title>PRD Builder — brief yang bisa dibaca AI</title>")
  .replace(/placeholder="Cari PRD[^"]*"/i, 'placeholder="Cari PRD…"')
  .replace(/<i>Tujuan, batas, alur, teknis[^<]*<\/i>/i, "<i>Tujuan, batas, alur, teknis — isi kalau perlu aja</i>")
  .replace(/<p>Prompt siap tempel[^<]*<\/p>/i, "<p>Prompt siap tempel — brief-nya sudah ikut di dalam, plus aturan kerja dan format jawaban.</p>");

const head = cleanHead(raw.slice(0, htmlEnd));

// head tidak boleh memuat sisa markup atau tag script apa pun
if (/<script/i.test(head)) throw new Error("head memuat <script — index.html sumber sudah tercemar");

// ---------- 2. inti ----------
for (const f of ["core-a.js", "core-b.js", "core-c.js", "core-d.js", "core-e.js"]) {
  if (read(f).includes("</script>")) throw new Error(f + " memuat </script> (tidak boleh)");
}

const core = ["core-a.js", "core-b.js", "core-c.js", "core-d.js", "core-e.js", "core-f.js"]
  .map(block)
  .join("\n\n")
  .replace(/\n<\/script>\s*$/, "") // core-f.js menutup sendiri
  .trim();

// ---------- 3. rakit sebagai array baris, bukan potongan string ----------
const parts = [
  head,
  "",
  "<script>",
  '(function () {',
  '  "use strict";',
  "",
  core,
  "})();",
  "</script>",
  "</body>",
  "</html>",
  ""
];

const out = parts.join("\n");

// ---------- 4. verifikasi sebelum menulis ----------
// hitung tag pembuka/penutup yang berada di awal baris (tag asli, bukan string di dalam JS)
const opens = (out.match(/^<script>$/gm) || []).length;
const closes = (out.match(/^<\/script>$/gm) || []).length;
if (opens !== 1 || closes !== 1) throw new Error("jumlah <script> salah: open=" + opens + " close=" + closes);

// tidak boleh ada markup mentah di antara toast dan <script> pertama
const afterToast = out.slice(head.length);
if (!/^\s*<script>/.test(afterToast)) {
  throw new Error("setelah </div> toast harus langsung <script>, dapat: " + JSON.stringify(afterToast.slice(0, 60)));
}

fs.writeFileSync(file, out, "utf8");
