# MapGenie Unlimited Markers

🗺️ Firefox extension yang menghapus batas 50 marker di [MapGenie](https://mapgenie.pro). Marking unlimited untuk semua game maps!

## ✨ Fitur

- **Unlimited Marking** — Tidak ada lagi batas 50 marker. Mark sebanyak yang kamu mau.
- **Per-Map Storage** — Marks disimpan per map/chapter, tidak tercampur.
- **Persist Across Refresh** — Marks yang kamu centang tetap muncul setelah refresh halaman.
- **Redux Integration** — Patch langsung ke Redux store MapGenie supaya checkmark muncul di visual peta.
- **Debug Panel** — Tap badge "∞ Unlimited ON" untuk melihat status dan log.
- **Works Offline** — Semua data tersimpan di `localStorage` browser kamu.

## 📱 Kompatibilitas

| Platform | Browser | Status |
|----------|---------|--------|
| Desktop | Firefox | ✅ Tested |
| Android | Firefox Nightly | ✅ Tested |

## 🚀 Instalasi

### Firefox Desktop

**Opsi A — File XPI (Temporary):**
1. Download file `.xpi` dari [Releases](../../releases)
2. Buka `about:debugging` → "This Firefox"
3. Klik "Load Temporary Add-on..." → pilih file `.xpi`

**Opsi B — Load dari folder:**
1. Clone/download repo ini
2. Buka `about:debugging` → "This Firefox"
3. Klik "Load Temporary Add-on..." → pilih `manifest.json`

### Firefox Nightly Android

1. Download file `.xpi`
2. Buka file `.xpi` di Firefox Nightly → Install
3. Atau: set `xpinstall.signatures.required = false` di `about:config`

## 🎮 Cara Pakai

1. Buka [MapGenie](https://mapgenie.pro) dan pilih game map kamu
2. Badge **"∞ Unlimited ON"** akan muncul di kiri bawah
3. Mark lokasi seperti biasa — addon otomatis menyimpan secara lokal
4. Refresh halaman — marks tetap tercentang! ✅

### Debug Panel

Tap badge "∞ Unlimited ON" untuk buka panel debug:

- **Status** — Lihat Map ID, jumlah marks tersimpan, status Pro, Redux restore
- **Log** — Riwayat detail operasi addon
- **Re-patch** — Manual restore kalau marks hilang
- **Copy** — Salin log ke clipboard

## ⚙️ Cara Kerja

1. **XHR/Fetch Intercept** — Menangkap request ke API MapGenie
2. **Pro Mode Patch** — Mengubah response `hasPro: true` supaya UI terbuka
3. **Local Storage** — Marks disimpan per-map di `localStorage`
4. **Redux Dispatch** — Dispatch action `MG:USER:MARK_LOCATION` ke Redux store supaya checkmark muncul visual di peta

## ⚠️ Disclaimer

Addon ini dibuat untuk keperluan edukasi dan personal use. Penggunaan addon ini mungkin melanggar [Terms of Service](https://mapgenie.pro/terms) MapGenie. Gunakan dengan risiko sendiri.

Kalau kamu suka MapGenie, pertimbangkan untuk [mendukung mereka](https://mapgenie.pro/pro) dengan membeli Pro! 🙏

## 📝 Changelog

### v2.7 (Latest)
- ✅ Per-map storage — marks tidak tercampur antar chapter
- ✅ Redux store integration — checkmark muncul visual setelah refresh
- ✅ Auto-cleanup invalid IDs
- ✅ Redux watcher — auto re-dispatch kalau state di-reset
- ✅ Migration dari storage format lama

### v2.5
- Redux dispatch untuk visual checkmark

### v2.4
- XHR listener timing fix

### v2.3
- Initial release dengan XHR/fetch intercept

## 📄 License

MIT License — Silakan dipakai, dimodifikasi, dan dibagikan.
