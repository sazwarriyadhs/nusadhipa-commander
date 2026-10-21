"use client";
import { getAuthHeaders } from "@/lib/auth-token";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

type Order = {
  id: number;
  order_number: string;
  status: string;
  grand_total: string | number;
  created_at: string;
  shipping_distance_km: string | number | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function badgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700";
    case "shipped":
      return "bg-blue-50 text-blue-700";
    case "paid":
      return "bg-violet-50 text-violet-700";
    case "processing":
      return "bg-amber-50 text-amber-700";
    case "pending_payment":
      return "bg-red-50 text-red-700";
    case "cancelled":
    case "refunded":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch(`${API_BASE}/admin/orders`, { cache: "no-store", headers: getAuthHeaders() });

      if (!response.ok) {
        throw new Error(`API pesanan merespons HTTP ${response.status}.`);
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Format data pesanan dari API tidak valid.");
      }

      setOrders(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat memuat data pesanan."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const statuses = useMemo(
    () => [...new Set(orders.map((order) => order.status))].sort(),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !term || order.order_number.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalValue = orders.reduce(
    (sum, order) => sum + (Number(order.grand_total) || 0),
    0
  );

  const pendingCount = orders.filter(
    (order) => order.status === "pending_payment"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  return (
    <main className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-600">
            NUSA-DHIPA / OPERASIONAL
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
            Manajemen Pesanan
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Pantau pesanan marketplace, status transaksi, dan jarak pengiriman
            berdasarkan data yang dikembalikan API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={refreshing || loading}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Memuat ulang…" : "↻ Muat Ulang"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Data pesanan gagal dimuat</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void loadOrders(true)}
            className="mt-3 font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Pesanan di respons API"
          value={loading ? "—" : orders.length}
          detail="Jumlah baris yang diterima"
        />
        <Metric
          label="Menunggu Pembayaran"
          value={loading ? "—" : pendingCount}
          detail="Status pending_payment"
        />
        <Metric
          label="Pesanan Selesai"
          value={loading ? "—" : completedCount}
          detail="Status completed"
        />
        <Metric
          label="Nilai Total Pesanan"
          value={loading ? "—" : rupiah(totalValue)}
          detail="Semua status dalam respons API"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Daftar Transaksi
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? "Mengambil data dari server…"
                  : `Menampilkan ${filteredOrders.length} dari ${orders.length} pesanan yang diterima`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor pesanan…"
                aria-label="Cari nomor pesanan"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 sm:w-64"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter status pesanan"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
              >
                <option value="all">Semua status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Memuat pesanan…
          </div>
        ) : !error && filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-gray-800">
              Tidak ada pesanan yang cocok.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Ubah kata pencarian atau filter status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Nomor Pesanan</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Nilai Pesanan
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Jarak Kirim
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">
                        {order.order_number}
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">
                        ID #{order.id}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {dateLabel(order.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(order.status)}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-900">
                      {rupiah(Number(order.grand_total) || 0)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-gray-600">
                      {order.shipping_distance_km == null
                        ? "—"
                        : `${Number(order.shipping_distance_km).toLocaleString("id-ID")} km`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs leading-5 text-gray-500">
          Nilai total di atas merupakan penjumlahan grand_total dari pesanan
          yang dikembalikan endpoint, bukan komisi atau pendapatan bersih
          platform. Endpoint saat ini mengembalikan maksimal 100 pesanan;
          pagination dan detail transaksi belum diimplementasikan di halaman ini.
        </footer>
      </section>
    </main>
  );
}
