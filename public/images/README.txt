Taruh foto asli mitra Sejasa di sini dengan nama file persis ini:

- foto-hero.jpg          → foto utama di bagian atas landing page (rasio lebar, 16:7)
                            cocok pakai foto gathering/kumpul bareng mitra, kesan hangat
- foto-massage.jpg       → foto mitra kategori Massage (rasio 4:3)
- foto-cleaning.jpg      → foto mitra kategori Daily Cleaning (rasio 4:3)
- foto-komunitas-1.jpg   → foto gathering mitra #1 (rasio 1:1, kotak)
- foto-komunitas-2.jpg   → foto gathering mitra #2 (rasio 1:1, kotak)
- foto-komunitas-3.jpg   → foto gathering mitra #3 (rasio 1:1, kotak)

Kalau file belum ada, landing page otomatis nampilin placeholder yang tetep rapi
(bukan gambar rusak/broken), jadi aman kalau mau deploy duluan sambil nunggu foto.

Tips: kalau foto persegi panjang tapi slotnya kotak (1:1) atau sebaliknya, foto bakal
di-crop otomatis biar pas (object-cover) — pilih foto yang subjek utamanya di tengah.

Setelah nambah/ganti foto, jangan lupa:
  git add .
  git commit -m "tambah foto landing page"
  git push
