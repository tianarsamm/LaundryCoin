// middleware.ts
// Hanya cek SESSION — tidak query database sama sekali
// Pengecekan role & permission dilakukan di masing-masing page/layout

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route yang tidak perlu login
const PUBLIC_ROUTES = ["/login", "/setup"];

// Route yang hanya boleh diakses super admin
// (pengecekan role tetap di page-nya, middleware hanya cek session)
const PROTECTED_ROUTES = [
  "/dashboard",
  "/pemasukan",
  "/pengeluaran",
  "/laporan",
  "/absensi",
  "/jadwal",
  "/manajemen-karyawan",
  "/kelola-absensi",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // ── Buat Supabase client SSR ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Refresh session (wajib untuk SSR) ──
  // getUser() lebih aman dari getSession() karena validasi ke server
  const { data: { user } } = await supabase.auth.getUser();

  // ── "/" → redirect ke dashboard atau login ──
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/login", request.url)
    );
  }

  // ── Public routes ──
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    // Sudah login → jangan bisa akses /login lagi
    if (user && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // ── Protected routes: wajib login ──
  const isProtected = PROTECTED_ROUTES.some(r =>
    pathname === r || pathname.startsWith(r + "/")
  );

  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Jalankan di semua route KECUALI static files & api
    "/((?!_next/static|_next/image|favicon.ico|icons|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};