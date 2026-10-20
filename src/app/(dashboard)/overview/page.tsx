import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart, StatusChart } from "@/components/dashboard/Charts";
import { TopTenantsTable } from "@/components/dashboard/TopTenantsTable";
import { SystemHealth, AiInsight } from "@/components/dashboard/Widgets";
import { Calendar, Download, TrendingUp, Wallet, ShoppingCart, Store, AlertCircle } from "lucide-react";
import { getDashboardOverview } from "@/lib/api/overview";

export const revalidate = 30; 

export default async function OverviewPage() {
  // 1. Ambil data dari API
  const apiData = await getDashboardOverview();
  
  // 2. Siapkan data default (Dummy)
  const defaultStats = {
    gmv: 284600000,
    revenue: 12800000,
    total_orders: 1248,
    active_tenants: 386,
    trends: { gmv_trend: 12.5, revenue_trend: 10.2, orders_trend: 18.7, tenants_trend: -2.1 }
  };

  // 3. GABUNGKAN data API dengan Default (Sanitizer)
  // Jika API tidak punya field 'trends', kita pakai defaultStats.trends agar tidak error.
  const stats = {
    ...defaultStats,
    ...(apiData || {}),
    trends: {
      ...defaultStats.trends,
      ...(apiData?.trends || {})
    }
  };

  // Cek apakah kita benar-benar pakai data API atau masih dummy
  // (Jika apiData null, berarti getDashboardOverview gagal)
  const isUsingDummy = !apiData;

  // Format angka
  const formatRp = (val: number) => `Rp ${(val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  const formatNum = (val: number) => val.toLocaleString('id-ID');

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Banner Peringatan jika API mati/gagal */}
      {isUsingDummy && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p><strong>Mode Offline:</strong> Gagal terhubung ke Marketplace API (Port 4000). Menampilkan data simulasi.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-brand-600 rounded-full shrink-0" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Executive Overview</h1>
            <p className="text-xs md:text-sm text-neutral-500 mt-0.5">Pantau performa ekosistem NUSA-DHIPA secara terpusat.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs md:text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate">20 Okt 2025 – 26 Okt 2025</span>
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors shrink-0">
            <Download className="w-4 h-4 shrink-0" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="GMV" value={formatRp(stats.gmv)} trend={stats.trends.gmv_trend} icon={TrendingUp} />
        <KpiCard title="Pendapatan Platform" value={formatRp(stats.revenue)} trend={stats.trends.revenue_trend} icon={Wallet} />
        <KpiCard title="Pesanan" value={formatNum(stats.total_orders)} trend={stats.trends.orders_trend} icon={ShoppingCart} />
        <KpiCard title="Tenant Aktif" value={formatNum(stats.active_tenants)} trend={stats.trends.tenants_trend} icon={Store} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-2 min-w-0">
          <TrendChart />
        </div>
        <div className="min-w-0">
          <StatusChart />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 items-start">
        <div className="xl:col-span-2 min-w-0">
          <TopTenantsTable />
        </div>
        <div className="space-y-4 md:space-y-5 min-w-0">
          <SystemHealth />
          <AiInsight />
        </div>
      </div>
    </div>
  );
}
