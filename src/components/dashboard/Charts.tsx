"use client";
import { getAuthHeaders } from "@/lib/auth-token";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
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

type Order = {
  id: number;
  order_number: string;
  status: string;
  grand_total: string | number;
  created_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type DailyPoint = {
  date: string;
  revenue: number;
  orders: number;
};

const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    color: "#DC2626",
  },
  paid: {
    label: "Sudah Dibayar",
    color: "#7C3AED",
  },
  processing: {
    label: "Diproses",
    color: "#D97706",
  },
  shipped: {
    label: "Dikirim",
    color: "#2563EB",
  },
  completed: {
    label: "Selesai",
    color: "#16A34A",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "#6B7280",
  },
  refunded: {
    label: "Dikembalikan",
    color: "#0891B2",
  },
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactRupiah(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} jt`;
  }

  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} rb`;
  }

  return formatRupiah(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/admin/orders`, { cache: "no-store", headers: getAuthHeaders(), signal: controller.signal });

        if (!response.ok) {
          throw new Error(`API mengembalikan HTTP ${response.status}`);
        }

        const result =
          (await response.json()) as ApiResponse<Order[]>;

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Format respons API pesanan tidak valid.");
        }

        setOrders(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data pesanan."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => controller.abort();
  }, []);

  return { orders, loading, error };
}

function ChartMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function TrendChart() {
  const { orders, loading, error } = useOrders();

  const dailyData = useMemo<DailyPoint[]>(() => {
    const grouped = new Map<string, DailyPoint>();

    for (const order of orders) {
      const date = new Date(order.created_at);

      if (Number.isNaN(date.getTime())) continue;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      const existing = grouped.get(key) ?? {
        date: key,
        revenue: 0,
        orders: 0,
      };

      existing.revenue += Number(order.grand_total) || 0;
      existing.orders += 1;

      grouped.set(key, existing);
    }

    return [...grouped.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        label: formatDate(`${item.date}T12:00:00`),
      })) as DailyPoint[];
  }, [orders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nilai Pesanan & Volume Transaksi</CardTitle>
        <p className="text-sm text-gray-500">
          Agregasi berdasarkan tanggal pembuatan pesanan yang dikembalikan API.
        </p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <ChartMessage>Memuat data pesanan dari server…</ChartMessage>
        ) : error ? (
          <ChartMessage>
            Data grafik tidak dapat dimuat: {error}
          </ChartMessage>
        ) : orders.length === 0 ? (
          <ChartMessage>Belum ada data pesanan untuk ditampilkan.</ChartMessage>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
              <span>
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />
                Nilai pesanan dibuat
              </span>
              <span>
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-gray-800" />
                Jumlah pesanan
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dailyData}
                  margin={{ top: 10, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tickFormatter={formatCompactRupiah}
                    tick={{ fontSize: 10 }}
                    width={82}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    width={30}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "Nilai pesanan"
                        ? formatRupiah(Number(value))
                        : Number(value),
                      name,
                    ]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    name="Nilai pesanan"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Jumlah pesanan"
                    stroke="#1F2937"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Berdasarkan {orders.length} pesanan yang dikembalikan endpoint
              API. Nilai ini mencakup semua status pesanan, bukan hanya
              pesanan selesai. Bukan histori transaksi lengkap.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusChart() {
  const { orders, loading, error } = useOrders();

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const order of orders) {
      counts.set(
        order.status,
        (counts.get(order.status) ?? 0) + 1
      );
    }

    return [...counts.entries()]
      .map(([status, value]) => ({
        name: STATUS_META[status]?.label ?? status,
        value,
        color: STATUS_META[status]?.color ?? "#9CA3AF",
      }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Pesanan</CardTitle>
        <p className="text-sm text-gray-500">
          Distribusi status dari respons API pesanan.
        </p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <ChartMessage>Memuat status pesanan…</ChartMessage>
        ) : error ? (
          <ChartMessage>
            Status pesanan tidak dapat dimuat: {error}
          </ChartMessage>
        ) : orders.length === 0 ? (
          <ChartMessage>Belum ada data pesanan.</ChartMessage>
        ) : (
          <>
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} pesanan`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={45}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-x-0 top-[35%] text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {orders.length}
                </div>
                <div className="text-xs text-gray-500">
                  Pesanan di respons API
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {statusData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 text-gray-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Jumlah status dihitung dari data yang dikembalikan endpoint,
              bukan total seluruh histori pesanan di database.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
