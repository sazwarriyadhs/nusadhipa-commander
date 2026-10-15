import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUSA-DHIPA Web Commander",
  description: "Platform control center untuk Owner dan Superadmin NUSA-DHIPA."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}