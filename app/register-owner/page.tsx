"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterOwnerPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    // CEK APAKAH SUDAH ADA SUPER ADMIN
    const { data: existingSuperAdmin } = await supabase
      .from("users")
      .select("id")
      .eq("role", "super_admin")
      .maybeSingle();

    // JIKA SUDAH ADA
    if (existingSuperAdmin) {
      alert("Super admin sudah ada");
      router.push("/login");
      return;
    }

    // REGISTER KE AUTH
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      alert("User gagal dibuat");
      return;
    }

    // INSERT KE PUBLIC.USERS
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email,
        nama,
        role: "super_admin",
        is_active: true,
      });

    if (userError) {
      alert(userError.message);
      return;
    }

    // SEMUA MENU
    const menus = [
      "dashboard",
      "pemasukan",
      "pengeluaran",
      "laporan",
      "manajemen_karyawan",
      "absensi",
    ];

    // INSERT FULL PERMISSION
    const permissions = menus.map((menu) => ({
      user_id: userId,
      menu_key: menu,
      is_enabled: true,
    }));

    const { error: permissionError } = await supabase
      .from("menu_permissions")
      .insert(permissions);

    if (permissionError) {
      alert(permissionError.message);
      return;
    }

    alert("Super admin berhasil dibuat");

    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto p-10">
      <h1 className="text-2xl font-bold mb-5">
        Register Owner
      </h1>

      <input
        type="text"
        placeholder="Nama"
        className="border p-2 w-full mb-3"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full mb-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleRegister}
        className="bg-black text-white px-4 py-2"
      >
        Register Super Admin
      </button>
    </div>
  );
}