# My App - Sistem Manajemen Karyawan dan Keuangan

Aplikasi web modern untuk manajemen karyawan, absensi, izin, dan keuangan perusahaan yang dibangun dengan **Next.js**, **React**, **TypeScript**, dan **Supabase**.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi Stack](#teknologi-stack)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi dan Setup](#instalasi-dan-setup)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Konfigurasi Environment](#konfigurasi-environment)

---

## ✨ Fitur Utama

- **Autentikasi & Login** - Sistem login dan registrasi dengan Supabase Auth
- **Dashboard** - Ringkasan data dan statistik karyawan
- **Manajemen Absensi** - Pencatatan dan tracking absensi karyawan
- **Manajemen Izin** - Pengajuan dan persetujuan izin karyawan
- **Manajemen Gaji** - Kelola data gaji dan payroll karyawan
- **Riwayat** - Histori data karyawan dan transaksi
- **Laporan** - Generate laporan absensi, izin, dan keuangan
- **Pemasukan** - Pencatatan pendapatan perusahaan
- **Pengeluaran** - Pencatatan pengeluaran perusahaan
- **Setup Konfigurasi** - Konfigurasi awal sistem dan enkripsi
- **Push Notifications** - Notifikasi real-time untuk update penting
- **Progressive Web App (PWA)** - Bisa diakses offline dengan Service Worker

---

## 🛠️ Teknologi Stack

### Frontend
- **Next.js 16.2.4** - React framework dengan App Router
- **React 19.2.4** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Chart.js 4 & react-chartjs-2** - Visualisasi data dan grafik

### Backend & Database
- **Supabase** - PostgreSQL database + authentication + storage
  - `@supabase/supabase-js` - Client library
  - `@supabase/auth-helpers-nextjs` - Auth helpers
  - `@supabase/ssr` - Server-side rendering support

### Development Tools
- **ESLint 9** - Code linting
- **Node.js** - Runtime environment

---

## 📁 Struktur Proyek

```
my-app/
├── app/                          # Next.js App Router directory
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout dengan navbar dan metadata
│   ├── page.tsx                 # Homepage
│   ├── api/                     # API Routes (Backend)
│   │   ├── absensi/
│   │   │   ├── route.ts         # CRUD absensi
│   │   │   ├── store-config/    # Konfigurasi penyimpanan
│   │   │   └── upload-foto/     # Upload foto absensi
│   │   ├── karyawan/            # CRUD data karyawan
│   │   │   └── route.ts
│   │   └── push-subscribe/      # Push notifications
│   │       ├── route.ts         # Subscribe handler
│   │       └── vapid-key/       # VAPID key untuk PWA
│   │
│   ├── absensi/                 # Halaman manajemen absensi
│   │   └── page.tsx
│   ├── dashboard/               # Dashboard utama
│   │   └── page.tsx
│   ├── izin/                    # Halaman manajemen izin
│   │   └── page.tsx
│   ├── laporan/                 # Generate dan view laporan
│   │   └── page.tsx
│   ├── login/                   # Halaman login
│   │   └── page.tsx
│   ├── manajemen/               # Modul manajemen lengkap
│   │   ├── page.tsx
│   │   ├── gaji/                # Manajemen gaji/payroll
│   │   │   └── page.tsx
│   │   ├── izin/                # Manajemen izin karyawan
│   │   │   └── page.tsx
│   │   └── riwayat/             # Riwayat data karyawan
│   │       └── page.tsx
│   ├── pemasukan/               # Pencatatan pemasukan
│   │   └── page.tsx
│   ├── pengeluaran/             # Pencatatan pengeluaran
│   │   └── page.tsx
│   ├── register-owner/          # Registrasi pemilik/admin
│   │   └── page.tsx
│   └── setup/                   # Setup awal sistem
│       ├── page.tsx
│       └── SetupClient.tsx       # Client component untuk setup
│
├── components/                  # Reusable React components
│   ├── Navbar.tsx               # Navigation bar
│   ├── ServiceWorkerRegister.tsx # PWA service worker registration
│   ├── FormPemasukan.tsx         # Form untuk input pemasukan
│   ├── FormPengeluaran.tsx       # Form untuk input pengeluaran
│   ├── Statcard.tsx              # Card statistik di dashboard
│   ├── TabelTransaksi.tsx        # Tabel untuk menampilkan transaksi
│   └── TransaksiChart.tsx        # Grafik transaksi dengan Chart.js
│
├── lib/                         # Utility functions & helpers
│   ├── auth.ts                  # Supabase auth configuration
│   ├── auth-types.ts            # TypeScript types untuk auth
│   ├── constants.ts             # Konstanta aplikasi
│   ├── supabaseClient.ts         # Supabase client configuration
│   └── supabase/
│       ├── client.ts            # Client-side Supabase initialization
│       ├── server.ts            # Server-side Supabase initialization
│       ├── storage.ts           # Fungsi untuk upload/download file
│       ├── types.ts             # Database types & interfaces
│       └── hooks/
│           ├── useAbsensi.ts     # Custom hook untuk absensi
│           └── useAuth.ts        # Custom hook untuk auth
│
├── public/                      # Static files
│   ├── sw.js                    # Service Worker untuk PWA
│   └── logo/                    # Logo dan assets aplikasi
│
├── Configuration Files
│   ├── package.json             # Dependencies & scripts
│   ├── tsconfig.json            # TypeScript configuration
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── postcss.config.mjs        # PostCSS configuration
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── middleware.ts            # Next.js middleware
│   └── next-env.d.ts            # Auto-generated Next.js types
│
├── AGENTS.md                    # Agent configuration (jika ada)
├── CLAUDE.md                    # Claude configuration
└── README.md                    # File dokumentasi ini
```

---

## 🚀 Instalasi dan Setup

### Prerequisites
- **Node.js 18+** atau **Bun**
- **npm**, **yarn**, **pnpm**, atau **bun** sebagai package manager
- **Supabase account** untuk database dan authentication

### Langkah 1: Clone atau buat proyek
```bash
# Jika clone dari repository
git clone <repository-url>
cd my-app

# Atau jika baru, setup dengan create-next-app
npx create-next-app@latest my-app --typescript
```

### Langkah 2: Install dependencies
```bash
npm install
# atau
yarn install
# atau
pnpm install
# atau
bun install
```

### Langkah 3: Setup environment variables
Buat file `.env.local` di root proyek:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_database_url

# Encryption Key (untuk store config)
ENCRYPTION_KEY=your_encryption_key_here

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Langkah 4: Setup Supabase Database
1. Buat project baru di [Supabase](https://supabase.com)
2. Buat tabel-tabel berikut sesuai kebutuhan:
   - `karyawan` - Data master karyawan
   - `absensi` - Record absensi karyawan
   - `izin` - Pengajuan dan approval izin
   - `gaji` - Data gaji dan payroll
   - `transaksi_pemasukan` - Record pemasukan
   - `transaksi_pengeluaran` - Record pengeluaran
   - `users` - User authentication
   - `push_subscriptions` - Subscription untuk push notifications

3. Setup Row Level Security (RLS) untuk keamanan data

---

## 💻 Menjalankan Aplikasi

### Development Server
```bash
npm run dev
```
Server akan berjalan di [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 📱 Struktur Data & API Routes

### API Routes yang Tersedia

#### `/api/absensi` (POST, GET)
- **POST**: Tambah record absensi baru
- **GET**: Retrieve daftar absensi

#### `/api/absensi/store-config` (POST)
- Simpan konfigurasi enkripsi atau pengaturan penyimpanan

#### `/api/absensi/upload-foto` (POST)
- Upload foto untuk absensi (ke Supabase Storage)

#### `/api/karyawan` (POST, GET)
- **POST**: Tambah data karyawan baru
- **GET**: Retrieve daftar karyawan

#### `/api/push-subscribe` (POST)
- Register endpoint untuk push notifications

#### `/api/push-subscribe/vapid-key` (GET)
- Retrieve VAPID public key untuk PWA

---

## 🎨 Styling & Komponen

- **Tailwind CSS** untuk styling utility-first
- **Custom fonts**: Sora & DM Sans dari Google Fonts
- **Responsive design** untuk mobile dan desktop
- **Dark mode support** (jika dikonfigurasi di Tailwind)

---

## 🔐 Keamanan

- **Supabase Auth** untuk authentication yang aman
- **Row Level Security (RLS)** di database untuk data isolation
- **Environment variables** untuk secrets management
- **Server-side rendering** untuk sensitive operations
- **Service Worker** hanya load di secure contexts (HTTPS)

---

## 📦 Dependencies Summary

| Package | Version | Fungsi |
|---------|---------|--------|
| next | 16.2.4 | React framework |
| react | 19.2.4 | UI library |
| typescript | 5 | Type safety |
| tailwindcss | 4 | Styling |
| @supabase/supabase-js | 2.106.2 | Database & auth |
| @supabase/auth-helpers-nextjs | 0.15.0 | Auth helpers |
| @supabase/ssr | 0.10.3 | SSR support |
| chart.js | 4.5.1 | Data visualization |
| react-chartjs-2 | 5.3.1 | Chart component |

---

## 🚢 Deployment

Aplikasi ini bisa di-deploy di:
- **Vercel** (recommended, platform dari Next.js)
- **Railway**
- **Render**
- **Any Node.js hosting**

Pastikan environment variables sudah di-setup di platform deployment Anda.

---

## 📝 File Penting

- **middleware.ts** - Next.js middleware untuk request processing
- **lib/auth.ts** - Konfigurasi dan logic autentikasi
- **lib/supabase/*** - Integration dengan Supabase
- **public/sw.js** - Service Worker untuk offline support
- **app/layout.tsx** - Layout root yang wrap semua halaman

---

## 🔧 Development Tips

1. **Hot Reload**: Modifikasi file dan browser akan auto-update
2. **API Testing**: Gunakan Postman atau curl untuk test API routes
3. **Supabase Console**: Akses [https://supabase.com](https://supabase.com) untuk manage database langsung
4. **TypeScript**: Gunakan type definitions dari `lib/supabase/types.ts`

---

## 📚 Referensi Dokumentasi

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## 📞 Support & Troubleshooting

Jika mengalami masalah:
1. Check console browser untuk error messages
2. Lihat terminal untuk server logs
3. Verify environment variables di `.env.local`
4. Ensure Supabase project is active dan network accessible
5. Clear cache dan rebuild dengan `npm run build`

---

**Last Updated**: June 2026  
**Version**: 0.1.0  
**Author**: Development Team
