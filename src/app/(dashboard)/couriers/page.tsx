"use client";
import { getAuthHeaders } from "@/lib/auth-token";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import {
  Bike,
  Search,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  UserRound,
} from "lucide-react";

type Courier = {
  id: number | string;
  public_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  vehicle_type?: string | null;
  partnership_type?: string | null;
  plate_number?: string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

function statusLabel(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return {
        label: "Disetujui",
        className: "bg-green-100 text-green-700",
      };
    case "pending":
    case "pending_verification":
      return {
        label: "Menunggu Verifikasi",
        className: "bg-amber-100 text-amber-700",
      };
    case "rejected":
      return {
        label: "Ditolak",
        className: "bg-red-100 text-red-700",
      };
    case "suspended":
      return {
        label: "Ditangguhkan",
        className: "bg-neutral-200 text-neutral-700",
      };
    default:
      return {
        label: status || "Belum diketahui",
        className: "bg-neutral-100 text-neutral-600",
      };
  }
}

function partnershipLabel(value?: string | null) {
  // Aturan bisnis NUSA-DHIPA: seluruh kurir adalah freelance.
  // Nilai default hanya untuk kompatibilitas data lama yang NULL.
  const normalized = (value || "freelance").trim().toLowerCase();

  return normalized === "freelance"
    ? "Freelance"
    : normalized
        .split(/[_\s-]+/)
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1) : ""
        )
        .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCouriers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/courier/admin/list`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json", ...getAuthHeaders() },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Gagal mengambil data kurir (HTTP ${response.status})`
        );
      }

      if (result?.success !== true || !Array.isArray(result.data)) {
        throw new Error(
          result?.message || "Format respons API kurir tidak sesuai."
        );
      }

      setCouriers(result.data);
    } catch (err) {
      setCouriers([]);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data kurir."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCouriers();
  }, [loadCouriers]);

  const filteredCouriers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return couriers;

    return couriers.filter((courier) =>
      [
        courier.name,
        courier.email,
        courier.phone,
        courier.vehicle_type,
        courier.partnership_type || "freelance",
        courier.plate_number,
        courier.city,
        courier.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [couriers, search]);

  const approvedCount = couriers.filter(
    (courier) => courier.status?.toLowerCase() === "approved"
  ).length;

  const pendingCount = couriers.filter((courier) =>
    ["pending", "pending_verification"].includes(
      (courier.status || "").toLowerCase()
    )
  ).length;

  const rejectedOrSuspendedCount = couriers.filter((courier) =>
    ["rejected", "suspended"].includes(
      (courier.status || "").toLowerCase()
    )
  ).length;

  const freelanceCount = couriers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courier Management"
        description="Manajemen kurir freelance, data mitra, dan verifikasi akun NUSA-DHIPA."
        icon={Bike}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-50 p-3 text-red-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Kurir</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : couriers.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Disetujui</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : approvedCount}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : pendingCount}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-neutral-100 p-3 text-neutral-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">
                Ditolak / Ditangguhkan
              </p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : rejectedOrSuspendedCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-3 border-b border-neutral-100 bg-neutral-50 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, telepon, kemitraan, kota..."
              aria-label="Cari kurir"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-neutral-500">
              {loading
                ? "Memuat data..."
                : `${filteredCouriers.length} dari ${couriers.length} kurir`}
            </span>
            <button
              type="button"
              onClick={() => void loadCouriers()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">Gagal memuat data kurir</p>
            <p className="mt-1 break-words">{error}</p>
            <p className="mt-2 text-xs">
              Periksa koneksi API, konfigurasi CORS, dan endpoint{" "}
              <code>/courier/admin/list</code>.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Nama Kurir
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  No. Telepon
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Jenis Kemitraan
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Kendaraan
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Kota
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Status Verifikasi
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Terdaftar
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Mengambil data kurir dari API...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    Data belum dapat ditampilkan karena permintaan API gagal.
                  </td>
                </tr>
              ) : filteredCouriers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    {couriers.length === 0
                      ? "Belum ada data kurir pada database API."
                      : "Tidak ada kurir yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                filteredCouriers.map((courier) => {
                  const status = statusLabel(courier.status);

                  return (
                    <tr
                      key={courier.id}
                      className="transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-neutral-900">
                          {courier.name || "Tanpa nama"}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {courier.email || "-"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                        {courier.phone || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                          <UserRound className="h-3.5 w-3.5" />
                          {partnershipLabel(courier.partnership_type)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        <p>{courier.vehicle_type || "Belum diisi"}</p>
                        {courier.plate_number && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {courier.plate_number}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                        {courier.city || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-500">
                        {formatDate(courier.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Seluruh kurir NUSA-DHIPA menggunakan skema kemitraan freelance.
          </p>
          <p>
            {loading ? "…" : `${freelanceCount} kurir terdaftar`} · Status
            verifikasi terpisah dari status pengiriman.
          </p>
        </div>
      </Card>
    </div>
  );
}
