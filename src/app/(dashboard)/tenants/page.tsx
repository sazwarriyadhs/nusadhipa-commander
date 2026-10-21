"use client";
import { getAuthHeaders } from "@/lib/auth-token";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import {
  Store,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

type Tenant = {
  id: number | string;
  public_id?: string | null;
  business_name?: string | null;
  name?: string | null;
  slug?: string | null;
  business_type?: string | null;
  city?: string | null;
  province?: string | null;
  verification_status?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type TenantResponse = {
  success?: boolean;
  data?: Tenant[] | {
    tenants?: Tenant[];
    businesses?: Tenant[];
  };
  message?: string;
};

type TenantResult = {
  tenants: Tenant[];
  error: string | null;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

function getStatusClass(status?: string | null) {
  const value = (status || "").toLowerCase();

  if (["active", "approved", "verified", "completed"].includes(value)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (["rejected", "suspended", "inactive", "blocked"].includes(value)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-800";
}

function formatStatus(status?: string | null) {
  if (!status) return "Belum ditentukan";

  const labels: Record<string, string> = {
    active: "Aktif",
    approved: "Disetujui",
    pending: "Menunggu",
    pending_verification: "Menunggu verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak",
    suspended: "Ditangguhkan",
    inactive: "Tidak aktif",
    blocked: "Diblokir",
    completed: "Selesai",
  };

  return labels[status.toLowerCase()] || status.replace(/_/g, " ");
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function extractTenants(response: TenantResponse): Tenant[] | null {
  if (!response || response.success === false) return null;

  const data = response.data;

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    if (Array.isArray(data.tenants)) return data.tenants;
    if (Array.isArray(data.businesses)) return data.businesses;
  }

  return null;
}

async function getTenants(): Promise<TenantResult> {
  try {
    const response = await fetch(`${API_URL}/admin/tenants`, { cache: "no-store", headers: getAuthHeaders() });

    if (!response.ok) {
      return {
        tenants: [],
        error: `API mengembalikan HTTP ${response.status}.`,
      };
    }

    const result = (await response.json()) as TenantResponse;
    const tenants = extractTenants(result);

    if (!tenants) {
      return {
        tenants: [],
        error: result.message || "Format respons API tenant tidak sesuai.",
      };
    }

    return { tenants, error: null };
  } catch (error) {
    console.error("Gagal mengambil data tenant:", error);

    return {
      tenants: [],
      error: "Tidak dapat terhubung ke API NUSA-DHIPA.",
    };
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTenants() {
    setLoading(true);
    setError(null);

    const result = await getTenants();

    setTenants(result.tenants);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tenants;

    return tenants.filter((tenant) => {
      const searchable = [
        tenant.business_name,
        tenant.name,
        tenant.slug,
        tenant.business_type,
        tenant.city,
        tenant.province,
        tenant.status,
        tenant.verification_status,
      ];

      return searchable.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [tenants, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenant & Business Management"
        description="Kelola bisnis UMKM, status operasional, dan verifikasi tenant."
        icon={Store}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Total Tenant</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {loading ? "—" : tenants.length.toLocaleString("id-ID")}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Terverifikasi</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {loading
                ? "—"
                : tenants
                    .filter((tenant) =>
                      ["approved", "verified"].includes(
                        (tenant.verification_status || "").toLowerCase()
                      )
                    )
                    .length.toLocaleString("id-ID")}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Menunggu Verifikasi</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {loading
                ? "—"
                : tenants
                    .filter((tenant) =>
                      ["pending", "pending_verification", "under_review"].includes(
                        (tenant.verification_status || "").toLowerCase()
                      )
                    )
                    .length.toLocaleString("id-ID")}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-3 border-b border-neutral-100 bg-neutral-50 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari bisnis, jenis, atau kota..."
              aria-label="Cari tenant"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-500">
              {loading
                ? "Memuat data..."
                : `${filteredTenants.length.toLocaleString("id-ID")} dari ${tenants.length.toLocaleString("id-ID")} tenant`}
            </span>

            <button
              type="button"
              onClick={() => void loadTenants()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat ulang
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat data tenant</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadTenants()}
                className="mt-2 font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {!error && !loading && (
          <div className="flex items-center gap-2 px-4 pt-3 text-xs text-emerald-700">
            <Wifi className="h-4 w-4" />
            Data berhasil diterima dari API tenant.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Nama Bisnis</th>
                <th className="px-5 py-3 font-medium">Jenis Bisnis</th>
                <th className="px-5 py-3 font-medium">Lokasi</th>
                <th className="px-5 py-3 font-medium">Status Bisnis</th>
                <th className="px-5 py-3 font-medium">Verifikasi</th>
                <th className="px-5 py-3 font-medium">Tanggal Daftar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    Memuat data tenant...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    Data tidak dapat ditampilkan karena API gagal.
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    {tenants.length === 0
                      ? "Belum ada data tenant dari API."
                      : "Tidak ada tenant yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.public_id || tenant.id}
                    className="hover:bg-neutral-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-900">
                        {tenant.business_name || tenant.name || "Tanpa nama"}
                      </p>
                      {tenant.slug && (
                        <p className="mt-1 text-xs text-neutral-500">
                          {tenant.slug}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-neutral-600">
                      {tenant.business_type || "-"}
                    </td>

                    <td className="px-5 py-4 text-neutral-600">
                      {[tenant.city, tenant.province]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(tenant.status)}`}
                      >
                        {formatStatus(tenant.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(tenant.verification_status)}`}
                      >
                        {formatStatus(tenant.verification_status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-neutral-500">
                      {formatDate(tenant.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
