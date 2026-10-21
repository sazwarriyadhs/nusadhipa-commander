"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAuthHeaders } from "@/lib/auth-token";
import { Search, ShieldCheck, FileText, Building2, RefreshCw, Scale, AlertTriangle } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://api.nusadhipa.shop/api/v1").replace(/\/+$/, "");

type Summary = {
  total_businesses: number;
  businesses_with_nib: number;
  businesses_without_nib: number;
  verified_businesses: number;
  pending_businesses: number;
  total_kbli_references: number;
};

type Business = {
  id: number;
  public_id: string;
  business_name: string;
  legal_name: string | null;
  nib: string | null;
  kbli_code: string | null;
  kbli_name: string | null;
  verification_status: string;
  status: string;
  city: string | null;
  province: string | null;
  updated_at: string;
};

type Kbli = {
  code: string;
  title: string;
  description: string | null;
  level: string;
  source_version: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Akses ditolak. Login sebagai superadmin dan periksa token.");
    }
    throw new Error(`API mengembalikan HTTP ${response.status}.`);
  }
  const result = await response.json();
  if (!result?.success) throw new Error(result?.message || "Respons API tidak valid.");
  return result.data as T;
}

function Metric({ title, value, icon: Icon, note }: {
  title: string;
  value: number;
  icon: typeof Building2;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{value.toLocaleString("id-ID")}</p>
          <p className="mt-2 text-xs text-neutral-500">{note}</p>
        </div>
        <span className="rounded-lg bg-red-50 p-3 text-red-700"><Icon size={21} /></span>
      </div>
    </div>
  );
}

function statusText(value: string) {
  const labels: Record<string, string> = {
    verified: "Terverifikasi internal",
    pending: "Menunggu pemeriksaan",
    unverified: "Belum diverifikasi",
    rejected: "Ditolak",
    active: "Aktif",
    inactive: "Tidak aktif",
  };
  return labels[value] || value || "Belum ada status";
}

export default function LegalPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [kbliQuery, setKbliQuery] = useState("");
  const [kbli, setKbli] = useState<Kbli[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kbliError, setKbliError] = useState("");

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError("");
    try {
      const [nextSummary, nextBusinesses] = await Promise.all([
        apiGet<Summary>("/admin/legal/summary"),
        apiGet<Business[]>(`/admin/legal/businesses?search=${encodeURIComponent(term)}`),
      ]);
      setSummary(nextSummary);
      setBusinesses(nextBusinesses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data legalitas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  async function searchKbli() {
    setKbliError("");
    if (kbliQuery.trim().length < 2) {
      setKbli([]);
      setKbliError("Masukkan minimal 2 karakter kode atau uraian KBLI.");
      return;
    }
    try {
      const result = await apiGet<Kbli[]>(`/admin/legal/kbli?q=${encodeURIComponent(kbliQuery.trim())}`);
      setKbli(result);
      if (result.length === 0) setKbliError("Tidak ada referensi yang cocok.");
    } catch (e) {
      setKbliError(e instanceof Error ? e.message : "Pencarian KBLI gagal.");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Legalitas & Compliance"
        description="Pemeriksaan internal NIB, referensi KBLI 2025, dan kesiapan dokumen usaha."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Status internal, bukan validasi resmi instansi</p>
            <p className="mt-1">Data NIB dan status usaha berasal dari database. Keaslian NIB, sertifikat Halal, PIRT, dan izin lain belum diverifikasi langsung ke instansi penerbit.</p>
          </div>
        </div>
        <button onClick={() => void load(search)} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-medium hover:bg-amber-100">
          <RefreshCw size={15} /> Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total usaha" value={summary?.total_businesses ?? 0} icon={Building2} note="Usaha di database aktif" />
        <Metric title="NIB tercatat" value={summary?.businesses_with_nib ?? 0} icon={FileText} note={`${summary?.businesses_without_nib ?? 0} usaha tanpa NIB tercatat`} />
        <Metric title="Status verified" value={summary?.verified_businesses ?? 0} icon={ShieldCheck} note="Status internal database; bukan validasi OSS" />
        <Metric title="Referensi KBLI" value={summary?.total_kbli_references ?? 0} icon={Scale} note="Jumlah kode pada tabel referensi aktif" />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Referensi KBLI</h2>
          <p className="mt-1 text-sm text-neutral-500">Cari kode atau uraian pada tabel referensi KBLI yang tersedia di database.</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void searchKbli(); }}>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={kbliQuery} onChange={(event) => setKbliQuery(event.target.value)} placeholder="Contoh: kode KBLI atau perdagangan..." className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
          </div>
          <button className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800">Cari KBLI</button>
        </form>
        {kbliError && <p className="mt-3 text-sm text-neutral-600">{kbliError}</p>}
        {kbli.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr><th className="px-3 py-3">Kode</th><th className="px-3 py-3">Uraian</th><th className="px-3 py-3">Level</th><th className="px-3 py-3">Versi sumber</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {kbli.map((item) => (
                  <tr key={item.code}>
                    <td className="px-3 py-3 font-mono font-semibold">{item.code}</td>
                    <td className="px-3 py-3"><p className="font-medium">{item.title}</p>{item.description && <p className="mt-1 max-w-2xl text-xs text-neutral-500">{item.description}</p>}</td>
                    <td className="px-3 py-3">{item.level}</td>
                    <td className="px-3 py-3">{item.source_version || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Pemeriksaan legalitas usaha</h2>
            <p className="mt-1 text-sm text-neutral-500">Maksimal 200 hasil. Tahap ini hanya membaca data, tidak mengubah status.</p>
          </div>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(search); }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama usaha, NIB, kode KBLI..." className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 sm:w-72" />
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Cari</button>
          </form>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">Memuat data legalitas...</div>
        ) : businesses.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">Tidak ada data usaha yang cocok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Nama usaha</th>
                  <th className="px-4 py-3">NIB</th>
                  <th className="px-4 py-3">KBLI utama tercatat</th>
                  <th className="px-4 py-3">Status internal</th>
                  <th className="px-4 py-3">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {businesses.map((business) => (
                  <tr key={business.public_id || business.id} className="align-top hover:bg-neutral-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-neutral-900">{business.business_name}</p>
                      {business.legal_name && <p className="mt-1 text-xs text-neutral-500">{business.legal_name}</p>}
                      <p className="mt-1 text-xs text-neutral-400">ID: {business.public_id}</p>
                    </td>
                    <td className="px-4 py-4">
                      {business.nib ? <span className="font-mono">{business.nib}</span> : <span className="text-amber-700">Belum tercatat</span>}
                    </td>
                    <td className="px-4 py-4">
                      {business.kbli_code ? <><p className="font-mono font-semibold">{business.kbli_code}</p><p className="mt-1 max-w-xs text-xs text-neutral-500">{business.kbli_name || "Uraian belum tercatat"}</p></> : <span className="text-neutral-400">Belum tercatat</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">{statusText(business.verification_status)}</span>
                      <p className="mt-2 text-xs text-neutral-500">Usaha: {statusText(business.status)}</p>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{[business.city, business.province].filter(Boolean).join(", ") || "Belum tercatat"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Halal, PIRT, dan izin lainnya</h2>
        <p className="mt-2 text-sm text-neutral-600">Arsip dan verifikasi dokumen belum tersedia di skema database yang terdeteksi. Bagian ini belum menampilkan dokumen atau status yang tidak tersimpan.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Sertifikat Halal", "PIRT / izin pangan", "Izin usaha lainnya"].map((name) => (
            <div key={name} className="rounded-lg border border-dashed border-neutral-300 p-4">
              <p className="font-medium text-neutral-800">{name}</p>
              <p className="mt-1 text-xs text-neutral-500">Arsip dokumen belum dikonfigurasi</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}