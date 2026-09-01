// Helper kirim notifikasi WhatsApp via Fonnte (https://api.fonnte.com/send)
// JANGAN import ini di komponen client — pakai token rahasia di server saja.

// Rapikan nomor telepon Indonesia (08xx / +62xx / 62xx) jadi format 62xxxxxxxxxx
// yang diminta Fonnte di parameter `target`.
export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }
  return digits;
}

// Ganti placeholder {nama}, {kategori}, dst di template pesan dengan data pelamar.
export function renderTemplate(template, data) {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : match;
  });
}

// Kirim satu pesan WhatsApp lewat Fonnte.
// Return { success: boolean, error?: string, raw?: any } — sengaja tidak throw,
// biar gagal kirim WA tidak pernah menggagalkan update status pelamar di DB.
export async function sendWhatsAppNotification({ phone, message }) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return { success: false, error: "FONNTE_TOKEN belum diset di environment variables" };
  }

  const target = normalizePhone(phone);
  if (!target) {
    return { success: false, error: "Nomor telepon pelamar tidak valid" };
  }

  try {
    const form = new URLSearchParams();
    form.append("target", target);
    form.append("message", message);

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const raw = await res.json().catch(() => null);

    // Fonnte biasanya balas { status: true/false, ... } dengan HTTP 200 walau gagal,
    // jadi cek dua-duanya biar tidak salah anggap sukses.
    if (!res.ok || raw?.status === false) {
      return { success: false, error: raw?.reason || raw?.message || "Fonnte menolak permintaan", raw };
    }

    return { success: true, raw };
  } catch (err) {
    return { success: false, error: err.message || "Gagal menghubungi Fonnte" };
  }
}
