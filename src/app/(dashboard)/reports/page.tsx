"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAuthHeaders } from "@/lib/auth-token";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

type Summary = {
  total_orders: number;
  total_sales: number;
  total_discount: number;
  total_shipping: number;
  total_revenue: number;
};

type StatusRow = {
  status: string;
  count: number;
  total: number;
};

type Transaction = {
  order_number: string;
  status: string;
  placed_at: string | null;
  grand_total: number;
  buyer_name: string | null;
  items_count: number;
};

type ProductRow = {
  product_name: string;
  variant_name: string | null;
  total_qty: number;
  total_sales: number;
};

type DailyRow = {
  date: string;
  orders: number;
  total: number;
};

type ReportData = {
  period: { from: string; to: string };
  summary: Summary;
  by_status: StatusRow[];
  transactions: Transaction[];
  top_products: ProductRow[];
  daily_sales: DailyRow[];
};

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDates() {
  const now = new Date();
  return {
    from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("id-ID").format(
    Number.isFinite(Number(value)) ? Number(value) : 0
  );
}

function dateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortDate(value: string) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const content =
    "\uFEFF" +
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "unknown").toLowerCase();
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    paid: "bg-blue-50 text-blue-700 ring-blue-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    processing: "bg-sky-50 text-sky-700 ring-sky-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
    canceled: "bg-red-50 text-red-700 ring-red-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    shipped: "bg-violet-50 text-violet-700 ring-violet-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[normalized] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {String(status || "unknown").replace(/_/g, " ")}
    </span>
  );
}

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-400">
        —
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
      <p className="mt-1 text-xs text-gray-400">
        Tidak ada data yang ditampilkan untuk bagian ini.
      </p>
    </div>
  );
}

export default function Page() {
  const initial = useMemo(() => initialDates(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [appliedFrom, setAppliedFrom] = useState(initial.from);
  const [appliedTo, setAppliedTo] = useState(initial.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadReport = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({ from: start, to: end });
      const response = await fetch(
        `${API_BASE}/reports/financial?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Akses ditolak atau sesi login berakhir. Login kembali dan pastikan akun memiliki izin laporan."
          );
        }
        throw new Error(
          result?.error || `API laporan gagal (HTTP ${response.status}).`
        );
      }

      if (!result?.success || !result?.data?.summary) {
        throw new Error("Format respons API laporan tidak sesuai.");
      }

      setData(result.data as ReportData);
      setUpdatedAt(new Date().toLocaleString("id-ID"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data laporan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(initial.from, initial.to);
  }, [loadReport, initial.from, initial.to]);

  const applyFilter = () => {
    if (!from || !to) {
      setError("Tanggal awal dan akhir wajib diisi.");
      return;
    }
    if (from > to) {
      setError("Tanggal awal tidak boleh melewati tanggal akhir.");
      return;
    }
    setAppliedFrom(from);
    setAppliedTo(to);
    void loadReport(from, to);
  };

  const exportTransactions = () => {
    if (!data) return;
    downloadCsv(`nusadhipa-transaksi-${appliedFrom}-${appliedTo}.csv`, [
      [
        "Nomor Pesanan",
        "Tanggal",
        "Pembeli",
        "Status",
        "Jumlah Item",
        "Total Pesanan (IDR)",
      ],
      ...data.transactions.map((row) => [
        row.order_number,
        row.placed_at,
        row.buyer_name,
        row.status,
        row.items_count,
        row.grand_total,
      ]),
    ]);
  };

  const exportSummary = () => {
    if (!data) return;
    downloadCsv(`nusadhipa-ringkasan-${appliedFrom}-${appliedTo}.csv`, [
      ["LAPORAN KEUANGAN NUSA-DHIPA"],
      ["Periode", appliedFrom, "sampai", appliedTo],
      ["Cakupan", "Bisnis ID 1 sesuai konfigurasi endpoint API saat ini"],
      [],
      ["Metrik", "Nilai"],
      ["Total pesanan", data.summary.total_orders],
      ["Total penjualan item (IDR)", data.summary.total_sales],
      ["Total diskon (IDR)", data.summary.total_discount],
      ["Total ongkir (IDR)", data.summary.total_shipping],
      ["Total pendapatan pesanan (IDR)", data.summary.total_revenue],
      [],
      ["STATUS PESANAN"],
      ["Status", "Jumlah pesanan", "Total pesanan (IDR)"],
      ...data.by_status.map((row) => [
        row.status,
        row.count,
        row.total,
      ]),
      [],
      ["PRODUK TERLARIS"],
      ["Produk", "Varian", "Kuantitas", "Penjualan (IDR)"],
      ...data.top_products.map((row) => [
        row.product_name,
        row.variant_name,
        row.total_qty,
        row.total_sales,
      ]),
      [],
      ["PENJUALAN HARIAN"],
      ["Tanggal", "Pesanan", "Total (IDR)"],
      ...data.daily_sales.map((row) => [
        row.date,
        row.orders,
        row.total,
      ]),
    ]);
  };

  const summaryCards = data
    ? [
        {
          label: "Total Pesanan",
          value: number(data.summary.total_orders),
          note: "Pesanan dalam periode",
          icon: "▤",
        },
        {
          label: "Penjualan Item",
          value: money(data.summary.total_sales),
          note: "Nilai item sebelum penyesuaian",
          icon: "↗",
        },
        {
          label: "Total Diskon",
          value: money(data.summary.total_discount),
          note: "Diskon tercatat",
          icon: "%",
        },
        {
          label: "Ongkos Kirim",
          value: money(data.summary.total_shipping),
          note: "Ongkir tercatat",
          icon: "⇢",
        },
        {
          label: "Total Pesanan",
          value: money(data.summary.total_revenue),
          note: "Grand total pesanan",
          icon: "Rp",
        },
      ]
    : [];

  const maxDaily = Math.max(
    1,
    ...(data?.daily_sales || []).map((row) => Number(row.total) || 0)
  );

  return (
    <div className="min-h-full space-y-6 bg-gray-50/70 pb-8">
      <PageHeader
        title="Reports & Audit Center"
        description="Pusat laporan keuangan, transaksi, performa produk, dan ekspor data operasional."
      />

      <div className="space-y-5 px-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Ringkasan laporan
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Data aktual dari API marketplace, berdasarkan rentang tanggal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportSummary}
              disabled={!data || loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓ Ekspor Ringkasan CSV
            </button>
            <button
              type="button"
              onClick={exportTransactions}
              disabled={!data || loading}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓ Ekspor Transaksi CSV
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tanggal awal
              </span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tanggal akhir
              </span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </label>
            <button
              type="button"
              onClick={applyFilter}
              disabled={loading}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={() => void loadReport(appliedFrom, appliedTo)}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Memuat..." : "↻ Muat Ulang"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Periode aktif: {appliedFrom} — {appliedTo}
            </span>
            <span>
              {updatedAt ? `Diperbarui ${updatedAt}` : "Belum ada pembaruan"}
            </span>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <p className="font-semibold">Laporan belum dapat dimuat</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-red-700">
              Periksa koneksi API, token login, hak akses, dan konfigurasi
              NEXT_PUBLIC_API_URL.
            </p>
          </div>
        )}

        {loading && !data ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500">
            Mengambil data laporan dari API...
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <EmptyState message="Data laporan belum tersedia" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <span className="font-bold">Cakupan data</span>
              <span>
                Endpoint laporan saat ini menggunakan business ID 1. Angka
                berikut bukan laporan konsolidasi seluruh tenant.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((card, index) => (
                <div
                  key={`${card.label}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-500">
                      {card.label}
                    </p>
                    <span
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold ${
                        index === 4
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <p className="mt-4 break-words text-xl font-bold tracking-tight text-gray-950">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{card.note}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Section
                title="Tren Penjualan Harian"
                description="Total grand total pesanan per hari dari API."
              >
                {data.daily_sales.length === 0 ? (
                  <EmptyState message="Belum ada penjualan pada periode ini" />
                ) : (
                  <div className="space-y-4 p-5">
                    {data.daily_sales.map((row) => {
                      const amount = Number(row.total) || 0;
                      const width = Math.max(
                        amount > 0 ? 1.5 : 0,
                        (amount / maxDaily) * 100
                      );
                      return (
                        <div key={row.date}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-gray-600">
                              {shortDate(row.date)}
                            </span>
                            <span className="text-right font-semibold text-gray-900">
                              {money(amount)}
                              <span className="ml-2 font-normal text-gray-400">
                                · {number(row.orders)} pesanan
                              </span>
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-red-500 transition-all"
                              style={{ width: `${Math.min(100, width)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              <Section
                title="Status Pesanan"
                description="Jumlah dan nilai grand total per status."
              >
                {data.by_status.length === 0 ? (
                  <EmptyState message="Belum ada data status pesanan" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Pesanan
                          </th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Nilai
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.by_status.map((row) => (
                          <tr key={row.status} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-gray-800">
                              {number(row.count)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-right text-gray-600">
                              {money(row.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>

            <Section
              title="Produk Terlaris"
              description="Sepuluh kombinasi produk dan varian dengan penjualan tertinggi."
            >
              {data.top_products.length === 0 ? (
                <EmptyState message="Belum ada penjualan produk" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">#</th>
                        <th className="px-5 py-3 font-semibold">Produk</th>
                        <th className="px-5 py-3 font-semibold">Varian</th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Kuantitas
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Penjualan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.top_products.map((row, index) => (
                        <tr
                          key={`${row.product_name}-${row.variant_name}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-3 text-gray-400">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {row.product_name}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {row.variant_name || "-"}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-700">
                            {number(row.total_qty)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-gray-900">
                            {money(row.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section
              title="Detail Transaksi"
              description={`${number(data.transactions.length)} baris transaksi yang dikembalikan API untuk periode aktif.`}
              action={
                <button
                  type="button"
                  onClick={exportTransactions}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Ekspor CSV
                </button>
              }
            >
              {data.transactions.length === 0 ? (
                <EmptyState message="Tidak ada transaksi dalam periode ini" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Pesanan</th>
                        <th className="px-5 py-3 font-semibold">Tanggal</th>
                        <th className="px-5 py-3 font-semibold">Pembeli</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Item
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.transactions.map((row, index) => (
                        <tr
                          key={`${row.order_number}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-3 font-semibold text-gray-900">
                            {row.order_number || "-"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                            {dateTime(row.placed_at)}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {row.buyer_name || "Pembeli tidak tercatat"}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-5 py-3 text-right text-gray-600">
                            {number(row.items_count)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-gray-900">
                            {money(row.grand_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-5 text-gray-500">
              <strong className="text-gray-700">Catatan audit:</strong>{" "}
              halaman ini menampilkan data laporan yang tersedia dari endpoint
              keuangan. Halaman ini belum membaca audit trail perubahan data,
              aktivitas pengguna, atau riwayat login. Nilai keuangan mengikuti
              agregasi yang dilakukan backend dan perlu direkonsiliasi sebelum
              dipakai sebagai laporan akuntansi resmi.
            </div>
          </>
        )}
      </div>
    </div>
  );
}