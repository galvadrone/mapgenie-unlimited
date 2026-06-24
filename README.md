# MapGenie Unlimited Markers

🗺️ Firefox extension yang menghapus batas 50 marker di [MapGenie](https://mapgenie.pro). Marking unlimited untuk semua game maps!

## ✨ Fitur

- **Unlimited Marking** — Tidak ada lagi batas 50 marker. Mark sebanyak yang kamu mau.
- **Per-Map Storage** — Marks disimpan per map/chapter, tidak tercampur.
- **Persist Across Refresh** — Marks tetap muncul setelah refresh halaman.
- **Redux Integration** — Patch langsung ke Redux store MapGenie supaya checkmark muncul di visual peta.
- **Debug Panel** — Tap badge "∞ Unlimited ON" untuk melihat status dan log.

## 📱 Kompatibilitas

| Platform | Browser | Status |
|----------|---------|--------|
| Desktop | Firefox Developer Edition / Nightly | ✅ Install Permanen |
| Desktop | Firefox (Release) | ⚠️ Temporary saja |
| Android | Firefox Nightly | ✅ Install Permanen |

## 🚀 Instalasi

### ✅ Firefox Nightly / Developer Edition (Desktop) — RECOMMENDED

Cara ini membuat addon **terpasang permanen** dan tidak hilang saat Firefox ditutup.

1. Download [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) atau [Firefox Nightly](https://www.mozilla.org/firefox/channel/desktop/#nightly)
2. Buka `about:config` → cari `xpinstall.signatures.required` → set ke **`false`**
3. Download file `.xpi` dari [Releases](../../releases)
4. Buka `about:addons` → klik ikon gear ⚙️ → **"Install Add-on From File..."** → pilih `.xpi`
5. Addon terpasang permanen! ✅

### ⚠️ Firefox Release (Desktop) — Temporary

Firefox release tidak bisa install addon yang belum disign oleh Mozilla. Kamu bisa pakai addon secara temporary (hilang kalau Firefox ditutup):

1. Download file `.xpi` dari [Releases](../../releases)
2. Buka `about:debugging` → "This Firefox"
3. Klik **"Load Temporary Add-on..."** → pilih file `.xpi`
4. Addon aktif sampai Firefox ditutup — harus dipasang ulang setiap sesi

> 💡 **Catatan penting:** Meskipun addon harus dipasang ulang, **data marks kamu TIDAK hilang!**
> Marks disimpan di `localStorage` website mapgenie.pro, bukan di dalam addon.
> Jadi setiap kali kamu pasang ulang addon dan buka MapGenie, marks sebelumnya akan otomatis ter-restore. ✅

### ✅ Firefox Nightly Android — RECOMMENDED

1. Download file `.xpi` dari [Releases](../../releases)
2. Kirim file ke HP (via Telegram, Google Drive, dll)
3. Buka file `.xpi` di Firefox Nightly → **Install**

> Jika gagal, buka `about:config` → set `xpinstall.signatures.required = false` → coba lagi.

## 🎮 Cara Pakai

1. Buka [MapGenie](https://mapgenie.pro) dan pilih game map kamu
2. Badge **"∞ Unlimited ON"** akan muncul di kiri bawah halaman
3. Mark lokasi seperti biasa — addon otomatis menyimpan secara lokal
4. Refresh halaman — marks tetap tercentang! ✅

### Debug Panel

Tap badge **"∞ Unlimited ON"** untuk buka panel:

| Tab | Fungsi |
|-----|--------|
| **Status** | Map ID, jumlah marks, Pro mode, Redux status |
| **Log** | Riwayat detail operasi addon |
| **Re-patch** | Manual restore kalau marks tidak muncul |
| **Copy** | Salin log untuk debugging |

## 💾 Tentang Data

| Kondisi | Data Marks |
|---------|-----------|
| Refresh halaman | ✅ Tetap ada |
| Tutup & buka Firefox | ✅ Tetap ada |
| Reinstall / Update addon | ✅ Tetap ada |
| Clear browser cookies/data | ❌ Hilang |
| Ganti device/browser | ❌ Tidak tersinkron |
| Mode Private/Incognito | ❌ Tidak tersimpan |

Data disimpan di `localStorage` browser kamu dengan key:
- `mapgenie_unlimited_map_{mapId}` — marks per map

## ⚙️ Cara Kerja (Technical)

1. **XHR/Fetch Intercept** — Menangkap request ke API MapGenie
2. **Pro Mode Patch** — Mengubah response `hasPro: true` supaya UI Pro terbuka
3. **Local Storage** — Marks disimpan per-map di `localStorage`
4. **Redux Dispatch** — Dispatch action `MG:USER:MARK_LOCATION` ke Redux store supaya checkmark muncul di peta

## ⚠️ Disclaimer

Addon ini dibuat untuk keperluan **edukasi dan personal use**. Penggunaan addon ini mungkin melanggar [Terms of Service](https://mapgenie.pro/terms) MapGenie. Gunakan dengan risiko sendiri.

Kalau kamu suka MapGenie, pertimbangkan untuk [mendukung mereka](https://mapgenie.pro/pro) dengan berlangganan Pro! 🙏

## 📝 Changelog

### v2.7 (Latest)
- ✅ Per-map storage — marks tidak tercampur antar chapter/map
- ✅ Redux store integration — checkmark muncul visual setelah refresh
- ✅ Auto-cleanup invalid IDs saat pindah map
- ✅ Redux watcher — auto re-dispatch kalau state di-reset MapGenie
- ✅ Migration otomatis dari format storage lama

### v2.5
- Redux dispatch untuk visual checkmark

### v2.4
- XHR listener timing fix (constructor-level listener)

### v2.3
- Initial release dengan XHR/fetch intercept + Pro mode patch

## 📄 License

MIT License — Silakan dipakai, dimodifikasi, dan dibagikan.
