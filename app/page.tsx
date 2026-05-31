// ============================================================
// app/page.tsx — Redirect ke dashboard
// ============================================================

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}