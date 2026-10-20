"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const trendData = [
  { name: "20 Okt", gmv: 28, transaksi: 120 },
  { name: "21 Okt", gmv: 35, transaksi: 145 },
  { name: "22 Okt", gmv: 32, transaksi: 130 },
  { name: "23 Okt", gmv: 42, transaksi: 160 },
  { name: "24 Okt", gmv: 40, transaksi: 155 },
  { name: "25 Okt", gmv: 48, transaksi: 170 },
  { name: "26 Okt", gmv: 55, transaksi: 210 },
];

const statusData = [
  { name: "Selesai", value: 772, color: "#16A34A" },
  { name: "Dikirim", value: 224, color: "#2563EB" },
  { name: "Diproses", value: 150, color: "#F59E0B" },
  { name: "Menunggu Pembayaran", value: 102, color: "#DC2626" },
];

export function TrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren GMV & Transaksi</CardTitle>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button className="px-3 py-1 text-xs font-medium bg-brand-600 text-white rounded-md shadow-sm">7 Hari</button>
          <button className="px-3 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-900">30 Hari</button>
          <button className="px-3 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-900">90 Hari</button>
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} tickFormatter={(val) => `Rp ${val} jt`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="right" dataKey="transaksi" name="Jumlah Transaksi" fill="#E5E5E5" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="left" type="monotone" dataKey="gmv" name="GMV (Rp)" stroke="#C41E1E" strokeWidth={2} dot={{ r: 4, fill: '#C41E1E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Pesanan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-1/2 h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-neutral-900">1.248</span>
            <span className="text-xs text-neutral-500">Total Pesanan</span>
          </div>
        </div>
        <div className="w-1/2 space-y-3">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-neutral-600">{item.name}</span>
              </div>
              <div className="flex gap-2 font-medium">
                <span className="text-neutral-900">{item.value}</span>
                <span className="text-neutral-400">({Math.round(item.value / 1248 * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
