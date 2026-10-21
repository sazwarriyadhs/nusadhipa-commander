"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success || !result?.token) {
        throw new Error(
          result?.message ||
          `Login gagal (HTTP ${response.status}). Periksa API dan akun Anda.`
        );
      }

      // Simpan hanya token asli yang dikeluarkan backend.
      window.localStorage.setItem("accessToken", result.token);

      if (result.user) {
        window.localStorage.setItem(
          "authUser",
          JSON.stringify(result.user)
        );
      }

      setPassword("");
      router.replace("/finance");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Periksa koneksi API."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="h-2 bg-red-600" />
        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-xl font-black text-white">
              N
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
              NUSA-DHIPA
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Web Commander
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk menggunakan akun aktif yang terdaftar pada backend
              NUSA-DHIPA.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Memverifikasi akun..." : "Masuk ke Commander"}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            Akses modul tetap diverifikasi oleh backend. Login berhasil
            tidak memberikan hak superadmin secara otomatis.
          </p>
        </div>
      </section>
    </main>
  );
}