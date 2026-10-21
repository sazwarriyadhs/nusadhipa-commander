
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

type Tenant = {
  id: number;
  public_id: string;
  business_name: string;
  slug: string;
  business_type: string;
  city: string | null;
  province: string | null;
  verification_status: string;
  status: string;
  created_at: string;
};

type TenantResponse = {
  success: boolean;
  data: Tenant[];
};

async function getTenants(): Promise<{
  tenants: Tenant[];
  error: string | null;
}> {
  try {
    const response = await fetch(`${API_BASE}/admin/tenants`, {
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      return {
        tenants: [],
        error: `API tenant mengembalikan HTTP ${response.status}.`,
      };
    }

    const result = (await response.json()) as TenantResponse;

    if (!result.success || !Array.isArray(result.data)) {
      return {
        tenants: [],
        error: "Format data tenant dari API tidak valid.",
      };
    }

    return { tenants: result.data, error: null };
  } catch {
    return {
      tenants: [],
      error: "Tidak dapat terhubung ke API tenant.",
    };
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Aktif",
    inactive: "Tidak Aktif",
    suspended: "Ditangguhkan",
    verified: "Terverifikasi",
    pending: "Menunggu",
    rejected: "Ditolak",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function StatusBadge({
  value,
  kind,
}: {
  value: string;
  kind: "account" | "verification";
}) {
  const normalized = value.toLowerCase();

  const isPositive =
    kind === "account"
      ? normalized === "active"
      : normalized === "verified";

  const isNegative = [
    "suspended",
    "rejected",
    "inactive",
  ].includes(normalized);

  const classes = isPositive
    ? "bg-green-50 text-green-700 ring-green-200"
    : isNegative
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {statusLabel(normalized)}
    </span>
  );
}

export async function TopTenantsTable() {
  const { tenants, error } = await getTenants();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Tenant Terdaftar</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Data bisnis yang diterima dari API NUSA-DHIPA.
            </p>
          </div>

          <Link
            href="/tenants"
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Lihat semua →
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Belum ada data tenant yang dapat ditampilkan.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Tenant dalam respons API
              </span>
              <span className="text-xl font-bold text-gray-900">
                {tenants.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3 font-medium">Bisnis</th>
                    <th className="px-3 py-3 font-medium">Lokasi</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Verifikasi</th>
                    <th className="px-3 py-3 font-medium">Terdaftar</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-3 py-4">
                        <div className="max-w-[260px] font-semibold text-gray-900">
                          {tenant.business_name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {tenant.business_type || "Tipe belum tersedia"}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-gray-600">
                        {[tenant.city, tenant.province]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge
                          value={tenant.status}
                          kind="account"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge
                          value={tenant.verification_status}
                          kind="verification"
                        />
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-gray-600">
                        {formatDate(tenant.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Jumlah ini adalah baris tenant yang dikembalikan API,
              bukan klaim jumlah seluruh tenant jika API menerapkan batas data.
              Peringkat GMV belum ditampilkan karena data transaksi per tenant
              belum tersedia.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
