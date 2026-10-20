import { fetchApi } from './client';

export interface DashboardStats {
  gmv: number;
  revenue: number;
  total_orders: number;
  active_tenants: number;
  trends: {
    gmv_trend: number;
    revenue_trend: number;
    orders_trend: number;
    tenants_trend: number;
  };
}

export async function getDashboardOverview() {
  try {
    // CATATAN: Kita asumsikan ada endpoint /admin/dashboard di API Anda.
    // Jika belum ada, dashboard akan menampilkan mode offline (dummy).
    const data = await fetchApi<{ data: DashboardStats }>('/admin/dashboard');
    return data.data;
  } catch (error) {
    console.warn("Gagal mengambil data API, menggunakan fallback.");
    return null; 
  }
}
