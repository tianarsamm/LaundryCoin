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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-indigo-500/20 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-cyan-500/15 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Daftar Owner</h1>
            <p className="text-slate-400 text-sm">Buat akun super admin untuk sistem</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="kontakt@bisnis.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRegister}
            className="w-full mt-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Daftar Super Admin
          </button>

          <style jsx>{`
            @media (max-width: 768px) {
              div { padding: 1.5rem; }
              h1 { font-size: 1.75rem; }
              p { font-size: 0.8rem; }
            }
            
            @media (max-width: 640px) {
              div { padding: 1.25rem; border-radius: 1rem; }
              h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
              p { font-size: 0.75rem; }
              input { padding: 0.65rem 1rem; font-size: 0.95rem; }
              label { font-size: 0.65rem; letter-spacing: 0.05em; }
              button { padding: 0.65rem; font-size: 0.9rem; margin-top: 1.25rem; }
            }
            
            @media (max-width: 480px) {
              div { padding: 1rem; border-radius: 0.875rem; }
              h1 { font-size: 1.3rem; }
              input { padding: 0.6rem 0.875rem; font-size: 0.9rem; }
              button { padding: 0.6rem; font-size: 0.85rem; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}