"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAuthHeaders } from "@/lib/auth-token";

type Shipment = {
  status?: string;
};

type LogisticsSummary = {
  totalShipments: number;
  pendingShipments: number;
  shippedShipments: number;
  deliveredShipments: number;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

const EMPTY_SUMMARY: LogisticsSummary = {
  totalShipments: 0,
  pendingShipments: 0,
  shippedShipments: 0,
  deliveredShipments: 0,
};

function getStatusCount(items: Shipment[], statuses: string[]) {
  return items.filter((item) =>
    statuses.includes(String(item.status || "").toLowerCase())
  ).length;
}

export default function Page() {
  const [summary, setSummary] =
    useState<LogisticsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/admin/shipments`, {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Sesi tidak valid atau akses superadmin diperlukan. Silakan login kembali."
            );
          }

          throw new Error(
            `Gagal memuat pengiriman. HTTP ${response.status}.`
          );
        }

        const result = await response.json();
        const payload = result?.data;

        const items: Shipment[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.shipments)
            ? payload.shipments
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        if (!active) return;

        if (Array.isArray(payload) ||
            Array.isArray(payload?.shipments) ||
            Array.isArray(payload?.items)) {
          setSummary({
            totalShipments: items.length,
            pendingShipments: getStatusCount(items, [
              "pending",
              "processing",
              "ready",
            ]),
            shippedShipments: getStatusCount(items, [
              "shipped",
              "in_transit",
              "in transit",
            ]),
            deliveredShipments: getStatusCount(items, [
              "delivered",
              "completed",
            ]),
          });
        } else if (payload && typeof payload === "object") {
          setSummary({
            totalShipments: Number(
              payload.totalShipments ??
              payload.total_shipments ??
              payload.total ??
              0
            ),
            pendingShipments: Number(
              payload.pendingShipments ??
              payload.pending_shipments ??
              payload.pending ??
              0
            ),
            shippedShipments: Number(
              payload.shippedShipments ??
              payload.shipped_shipments ??
              payload.shipped ??
              0
            ),
            deliveredShipments: Number(
              payload.deliveredShipments ??
              payload.delivered_shipments ??
              payload.delivered ??
              0
            ),
          });
        } else {
          throw new Error("Format data pengiriman tidak dikenali.");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const metrics = [
    {
      label: "Total Pengiriman",
      value: summary.totalShipments,
      detail: "Data dari API",
    },
    {
      label: "Menunggu Proses",
      value: summary.pendingShipments,
      detail: "Menunggu diproses atau disiapkan",
    },
    {
      label: "Dalam Perjalanan",
      value: summary.shippedShipments,
      detail: "Status pengiriman berjalan",
    },
    {
      label: "Terkirim",
      value: summary.deliveredShipments,
      detail: "Pengiriman selesai",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logistics & Fulfillment"
        description="Pantau pengiriman, mitra kurir, tracking, biaya logistik, dan kebijakan gratis ongkir."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Ringkasan operasional
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan diambil dari endpoint administrasi pengiriman.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Memuat..." : "Muat Ulang"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Data logistik belum berhasil dimuat</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              {loading ? "—" : metric.value.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-gray-500">{metric.detail}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">
          Kebijakan pengiriman NUSA-DHIPA
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Acuan operasional platform; penerapan otomatis perlu dikonfirmasi
          pada checkout dan layanan pengiriman.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Jarak di bawah 5 km
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Ongkir gratis sesuai kebijakan yang disepakati. Biaya kurir
              tetap dicatat terpisah dari pendapatan produk dan biaya layanan.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Jarak 5 km atau lebih
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Ongkir dibayar pembeli. Tarif mengikuti jarak rute, metode
              pengiriman, dan kesepakatan dengan kurir.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Mitra pengiriman
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Dua opsi operasional: kurir pihak ketiga atau ojol, serta
              kurir freelance lokal untuk mendukung ekonomi masyarakat.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Kontrol biaya
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Biaya pengiriman, pembayaran kurir, dan pendapatan layanan
              platform harus direkonsiliasi secara terpisah.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">
          Integrasi yang perlu tersedia di API
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Tarif kurir, daftar mitra, tracking real-time, dan rekonsiliasi
          ongkir hanya dapat ditampilkan sebagai data aktual jika API
          menyediakan datanya. Halaman ini tidak membuat data transaksi
          atau biaya fiktif.
        </p>
      </section>
    </div>
  );
}