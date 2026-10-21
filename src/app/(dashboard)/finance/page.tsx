"use client";

import { useCallback, useEffect, useState } from "react";

type FinanceData = {
  success: boolean;
  generatedAt: string;
  definitions: Record<string, string>;
  summary: {
    orderCount: number; gmv: number; merchandiseNet: number;
    platformFee: number; shippingTotal: number; orderTotal: number;
    refundedOrders: number; cancelledOrders: number;
  };
  payments: {
    succeededAmount: number; succeededCount: number;
    refundedAmount: number; pendingAmount: number;
  };
  settlement: { available: boolean; reason: string };
  businesses: Array<{
    businessId: string; businessName: string;
    orderCount: number; grossItemSales: number;
  }>;
  recentOrders: Array<{
    id: string; orderNumber: string; status: string; currency: string;
    subtotal: number; discountTotal: number; shippingTotal: number;
    platformFee: number; grandTotal: number;
    succeededPaymentAmount: number; succeededPaymentCount: number;
    createdAt: string;
  }>;
};

const API = (process.env.NEXT_PUBLIC_API_URL || "https://api.nusadhipa.shop/api/v1")
  .replace(/\/+$/, "");

function money(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency, maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function date(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) :
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function getAuthToken() {
  if (typeof window === "undefined") return "";
  const keys = ["accessToken", "access_token", "token", "authToken"];
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const response = await fetch(`${API}/admin/finance/dashboard`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || body.error ||
          `Gagal memuat laporan keuangan (HTTP ${response.status}).`);
      }
      setData(body as FinanceData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refresh]);

  const card = (label: string, value: string, note: string) => (
    <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-gray-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{note}</p>
    </div>
  );

  return (
    <main className="space-y-6 p-4 text-gray-900 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">NUSA-DHIPA · Finance</p>
          <h1 className="mt-1 text-3xl font-bold">Finance &amp; Revenue</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            GMV, service fee, pembayaran, penjualan tenant, dan rekonsiliasi berbasis transaksi database.
          </p>
        </div>
        <button onClick={() => setRefresh((v) => v + 1)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
          {loading ? "Memuat..." : "Perbarui data"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Laporan belum dapat dimuat</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">Pastikan API aktif, token login tersedia, dan akun memiliki role superadmin.</p>
        </div>
      )}

      {loading && !data && <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">Mengambil data keuangan dari API…</div>}

      {data && (
        <>
          <p className="text-xs text-gray-500">Data diperbarui: {date(data.generatedAt)}</p>

          <section>
            <h2 className="mb-3 text-lg font-bold">Ringkasan transaksi</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {card("GMV", money(data.summary.gmv), `${data.summary.orderCount} pesanan valid; sebelum diskon.`)}
              {card("Penjualan setelah diskon", money(data.summary.merchandiseNet), "Subtotal dikurangi diskon; tidak termasuk ongkir.")}
              {card("Service fee platform", money(data.summary.platformFee), "Nilai platform_fee yang tersimpan pada pesanan valid.")}
              {card("Total ongkir pesanan", money(data.summary.shippingTotal), "Ditampilkan terpisah dari penjualan produk dan pendapatan platform.")}
              {card("Total grand total pesanan", money(data.summary.orderTotal), "Termasuk komponen pesanan yang tersimpan; bukan otomatis kas diterima.")}
              {card("Pembayaran sukses", money(data.payments.succeededAmount), `${data.payments.succeededCount} catatan pembayaran berstatus succeeded.`)}
              {card("Pembayaran menunggu", money(data.payments.pendingAmount), "Pembayaran berstatus pending atau processing.")}
              {card("Pembayaran refunded", money(data.payments.refundedAmount), `${data.summary.refundedOrders} pesanan berstatus refunded.`)}
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-950">Settlement tenant</h2>
            <p className="mt-2 text-sm text-amber-900">{data.settlement.reason}</p>
            <p className="mt-2 text-xs text-amber-800">
              Penjualan tenant di bawah ini bukan bukti transfer, pencairan, atau saldo settlement final.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Penjualan per tenant</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr><th className="px-4 py-3">Tenant</th><th className="px-4 py-3 text-right">Pesanan</th><th className="px-4 py-3 text-right">Penjualan item</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.businesses.map((b) => (
                    <tr key={b.businessId}>
                      <td className="px-4 py-3 font-medium">{b.businessName}</td>
                      <td className="px-4 py-3 text-right">{b.orderCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">{money(b.grossItemSales)}</td>
                    </tr>
                  ))}
                  {!data.businesses.length && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Belum ada data tenant.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Rekonsiliasi pesanan dan pembayaran</h2>
            <p className="text-sm text-gray-600">
              Selisih dihitung sebagai grand total dikurangi pembayaran sukses yang tercatat.
              Nilai berbeda perlu ditinjau manual; pembayaran parsial dan pembayaran ganda harus diperiksa sesuai bukti provider.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Pesanan / tanggal</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Grand total</th><th className="px-4 py-3 text-right">Pembayaran sukses</th>
                    <th className="px-4 py-3 text-right">Selisih</th><th className="px-4 py-3 text-right">Service fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentOrders.map((o) => {
                    const diff = o.grandTotal - o.succeededPaymentAmount;
                    return (
                      <tr key={o.id}>
                        <td className="px-4 py-3"><p className="font-semibold">{o.orderNumber}</p><p className="mt-1 text-xs text-gray-500">{date(o.createdAt)}</p></td>
                        <td className="px-4 py-3">{o.status}</td>
                        <td className="px-4 py-3 text-right">{money(o.grandTotal, o.currency)}</td>
                        <td className="px-4 py-3 text-right">{money(o.succeededPaymentAmount, o.currency)}<p className="text-xs text-gray-500">{o.succeededPaymentCount} catatan sukses</p></td>
                        <td className={`px-4 py-3 text-right font-semibold ${Math.abs(diff) > 0.5 ? "text-red-700" : "text-green-700"}`}>{money(diff, o.currency)}</td>
                        <td className="px-4 py-3 text-right">{money(o.platformFee, o.currency)}</td>
                      </tr>
                    );
                  })}
                  {!data.recentOrders.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Belum ada pesanan.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">Definisi dan batasan laporan</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
              {Object.entries(data.definitions).map(([key, value]) => (
                <li key={key}><span className="font-semibold text-gray-800">{key}:</span> {value}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Menampilkan maksimal 100 pesanan terbaru untuk rekonsiliasi. Ringkasan menggunakan seluruh pesanan dengan status yang disebutkan pada definisi GMV.
            </p>
          </section>
        </>
      )}
    </main>
  );
}