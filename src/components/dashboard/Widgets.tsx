import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Cloud, Database, Clock, CreditCard, Lightbulb, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";

const healthItems = [
  { name: "API Services", status: "Normal", detail: "Response 243 ms", icon: Cloud },
  { name: "MySQL Database", status: "Normal", detail: "Uptime 99,98%", icon: Database },
  { name: "Background Jobs", status: "Normal", detail: "Queue 0 pending", icon: Clock },
  { name: "Payment Gateway", status: "Normal", detail: "Success Rate 99,2%", icon: CreditCard },
];

export function SystemHealth() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-600" />
          <CardTitle>System Health</CardTitle>
        </div>
        <Link href="/system" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center">
          Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {healthItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {item.status}
                </span>
                <span className="text-neutral-400 w-28 text-right">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AiInsight() {
  return (
    <Card className="bg-gradient-to-br from-brand-50 to-white border-brand-100">
      <CardHeader className="border-none pb-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-100 rounded-md">
            <Lightbulb className="w-4 h-4 text-brand-600" />
          </div>
          <CardTitle>AI Business Insight</CardTitle>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded">Beta</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
          Penjualan Kategori <strong className="text-neutral-900">Makanan & Minuman</strong> meningkat <strong className="text-green-600">28,4%</strong> dalam 7 hari terakhir. Peluang terbaik untuk ekspansi adalah di wilayah Kabupaten Bogor dan Kota Depok.
        </p>
        <button className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          Lihat Rekomendasi <ChevronRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
