import { NextResponse } from "next/server";
import { createKaryawan } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[POST /api/karyawan] Request body:", {
      email: body.email,
      nama: body.nama,
      username: body.username,
      role: body.role,
      // Don't log password for security
    });

    const { email, password, nama, username, no_hp, rotation_index, role } = body;

    // Validate required fields
    if (!email || !password || !nama) {
      return NextResponse.json(
        { success: false, error: "Email, password, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const result = await createKaryawan({
      email,
      password,
      nama,
      username,
      no_hp,
      rotation_index,
      role,
    });

    if (!result.success) {
      console.error("[POST /api/karyawan] createKaryawan failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error ?? "Gagal membuat karyawan" },
        { status: 500 }
      );
    }

    console.log("[POST /api/karyawan] Karyawan berhasil dibuat:", result.user?.id);
    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error("[POST /api/karyawan] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
