import { NextResponse } from "next/server";
import { uploadToDrive } from "@/lib/googleDrive";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Batas 5MB, samain dengan asumsi ukuran sertifikat/paklaring
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${file.name}`;

    const uploaded = await uploadToDrive(buffer, uniqueName, file.type);

    return NextResponse.json({
      fileUrl: uploaded.webViewLink,
      fileName: file.name,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}
