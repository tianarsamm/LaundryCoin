// app/setup/page.tsx
// Cukup render SetupClient — pengecekan super admin sudah ada
// dilakukan di SetupClient itu sendiri saat mount.
import SetupClient from "./SetupClient";

export default function SetupPage() {
  return <SetupClient />;
}