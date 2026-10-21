import { getAuthHeaders } from "@/lib/auth-token";
const BASE = process.env.NEXT_PUBLIC_COMMANDER_API ?? "http://localhost:4000/api/v1";

export type DashboardStats = { total_tenants: number; total_products: number; total_orders: number; total_couriers: number; total_revenue: number | string; };
export type Shipment = { order: string; status: string; amount: number | string; route_code?: string | null; };
export type Tenant = { id: number; business_name: string; city: string; status: string; verification_status: string; };
export type Courier = { id: number; name: string; email: string; city?: string | null; status: string; };
export type Product = { id: number; name: string; price: number; stock: number; tenant_name: string; };

type ListResponse<T> = { items: T[]; total: number };

async function getRaw(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

function unwrapArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  const firstArray = body && typeof body === "object" ? Object.values(body).find(Array.isArray) : undefined;
  return (firstArray as any[]) ?? [];
}

async function getList<T>(path: string): Promise<ListResponse<T>> {
  const body = await getRaw(path);
  const items = unwrapArray(body) as T[];
  const total = Number(body?.pagination?.total) || Number(body?.total) || items.length;
  return { items, total };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const raw: any = await getRaw("/admin/dashboard");
    const src = raw?.data ?? raw;
    const pick = (...keys: string[]) => { for (const k of keys) if (src?.[k] != null) return Number(src[k]); return undefined; };
    return {
      total_tenants: pick("total_tenants", "totalTenants") ?? 0,
      total_products: pick("total_products", "totalProducts") ?? 0,
      total_orders: pick("total_orders", "totalOrders") ?? 0,
      total_couriers: pick("total_couriers", "totalCouriers") ?? 0,
      total_revenue: pick("total_revenue", "totalRevenue", "revenue") ?? 0,
    };
  } catch {
    const [t, p, o, c] = await Promise.all([
      getList<any>("/admin/tenants").catch(() => ({ items: [], total: 0 })),
      getList<any>("/products").catch(() => ({ items: [], total: 0 })),
      getList<any>("/orders").catch(() => ({ items: [], total: 0 })),
      getList<any>("/courier/admin/list").catch(() => ({ items: [], total: 0 })),
    ]);
    return {
      total_tenants: t.total, total_products: p.total, total_orders: o.total, total_couriers: c.total,
      total_revenue: o.items.reduce((sum, x) => sum + Number(x.grand_total ?? x.total ?? 0), 0),
    };
  }
}

export async function getShipments(): Promise<Shipment[]> {
  const { items } = await getList<any>("/shipments").catch(() => ({ items: [], total: 0 }));
  return items.map((o) => ({ order: String(o.order_number ?? o.order_code ?? o.code ?? o.public_id ?? "-"), status: String(o.status ?? "-"), amount: o.grand_total ?? o.total ?? o.amount ?? 0, route_code: o.route_code ?? null }));
}

export async function getTenants(): Promise<Tenant[]> {
  const { items } = await getList<any>("/admin/tenants").catch(() => ({ items: [], total: 0 }));
  return items.map((t) => ({ id: Number(t.id ?? 0), business_name: String(t.business_name ?? t.name ?? "-"), city: String(t.city ?? "-"), status: String(t.status ?? "-"), verification_status: String(t.verification_status ?? "-") }));
}

export async function getCouriers(): Promise<Courier[]> {
  const { items } = await getList<any>("/courier/admin/list").catch(() => ({ items: [], total: 0 }));
  return items.map((c) => ({ id: Number(c.id ?? 0), name: String(c.name ?? "-"), email: String(c.email ?? "-"), city: c.city ?? null, status: String(c.status ?? "-") }));
}

export async function getProducts(): Promise<Product[]> {
  const { items } = await getList<any>("/products").catch(() => ({ items: [], total: 0 }));

  return items.map((p) => ({
    id: Number(p.id ?? 0),
    name: String(p.name ?? "-"),
    price: Number(p.min_retail_price ?? p.min_price ?? p.price ?? 0),
    stock: Number(p.available_stock ?? p.stock ?? 0),
    tenant_name: String(p.tenant_name ?? p.business_name ?? "-"),
  }));
}

export async function updateCourierStatus(id: number, status: string) {
  const res = await fetch(`${BASE}/courier/admin/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ status }) });
  if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
  return await res.json();
}
