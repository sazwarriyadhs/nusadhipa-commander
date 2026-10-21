
import {
  KpiCard,
} from "@/components/dashboard/KpiCard";
import {
  TrendChart,
  StatusChart,
} from "@/components/dashboard/Charts";
import { TopTenantsTable } from "@/components/dashboard/TopTenantsTable";
import { SystemHealth, AiInsight } from "@/components/dashboard/Widgets";
import {
  Calendar,
  Download,
  Wallet,
  ShoppingCart,
  Store,
  Package,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

export const revalidate = 10;

type DashboardApiData = {
  total_tenants: number;
  total_products: number;
  total_orders: number;
  total_couriers: number;
  couriers_pending: number;
  total_revenue: string | number;
};

type OverviewData = {
  totalTenants: number;
  totalProducts: number;
  totalOrders: number;
  completedOrderValue: number;
  isLive: boolean;
};

async function getOverviewData(): Promise<OverviewData | null> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.nusadhipa.shop/api/v1"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`Dashboard API HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result?.success || !result?.data) {
      throw new Error("Format respons dashboard tidak sesuai");
    }

    const data = result.data as DashboardApiData;

    const numericFields = [
      data.total_tenants,
      data.total_products,
      data.total_orders,
      Number(data.total_revenue),
    ];

    if (!numericFields.every((value) => Number.isFinite(value))) {
      throw new Error("Data KPI dashboard tidak valid");
    }

    return {
      totalTenants: data.total_tenants,
      totalProducts: data.total_products,
      totalOrders: data.total_orders,
      completedOrderValue: Number(data.total_revenue),
      isLive: true,
    };
  } catch (error) {
    console.error("Gagal mengambil dashboard NUSA-DHIPA:", error);
    return null;
  }
}

function formatRp(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} jt`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default async function OverviewPage() {
  const stats = await getOverviewData();

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 shrink-0 rounded-full bg-brand-600" />
          <div>
            <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">
              Executive Overview
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500 md:text-sm">
              Pantau performa ekosistem NUSA-DHIPA secara terpusat.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 md:gap-3 lg:w-auto">
          <button
            type="button"
            disabled
            title="Filter tanggal belum tersedia pada endpoint dashboard"
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-400 opacity-75 lg:flex-none md:text-sm"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Pilih rentang tanggal</span>
          </button>

          <button
            type="button"
            disabled
            title="Ekspor laporan belum diimplementasikan"
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white opacity-60 lg:flex-none md:text-sm"
          >
            <Download className="h-4 w-4 shrink-0" />
            Export
          </button>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
          stats?.isLive
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
        role="status"
      >
        {stats?.isLive ? (
          <Wifi className="h-4 w-4 shrink-0" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0" />
        )}
        <span>
          {stats?.isLive
            ? "Terhubung ke API dashboard NUSA-DHIPA."
            : "Data dashboard tidak tersedia. Periksa koneksi API; angka KPI tidak ditampilkan sebagai data live."}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Nilai Pesanan Selesai"
          value={stats ? formatRp(stats.completedOrderValue) : "—"}
          trend={0}
          icon={Wallet}
        />
        <KpiCard
          title="Total Pesanan"
          value={stats ? stats.totalOrders.toLocaleString("id-ID") : "—"}
          trend={0}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Tenant Terdaftar"
          value={stats ? stats.totalTenants.toLocaleString("id-ID") : "—"}
          trend={0}
          icon={Store}
        />
        <KpiCard
          title="Produk Terdaftar"
          value={stats ? stats.totalProducts.toLocaleString("id-ID") : "—"}
          trend={0}
          icon={Package}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600 md:p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
          <p>
            Nilai pesanan selesai merupakan nilai transaksi berstatus selesai
            dari API, bukan pendapatan komisi platform. Tren historis dan
            komisi aktual memerlukan data agregat tersendiri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TrendChart />
        </div>
        <div className="min-w-0">
          <StatusChart />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <TopTenantsTable />
        </div>
        <div className="min-w-0 space-y-4 md:space-y-5">
          <SystemHealth />
          <AiInsight />
        </div>
      </div>
    </div>
  );
}
