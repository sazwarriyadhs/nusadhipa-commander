import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const data = [
  { id: 1, name: "Fresh Market Unggas", city: "Kab. Bogor", category: "Makanan & Minuman", orders: 312, gmv: "Rp 68,4 jt" },
  { id: 2, name: "Sauri Fresh", city: "Kota Bogor", category: "Pertanian & Peternakan", orders: 248, gmv: "Rp 52,7 jt" },
  { id: 3, name: "Digi Mart", city: "Kota Bogor", category: "Elektronik & Gadget", orders: 176, gmv: "Rp 38,9 jt" },
  { id: 4, name: "Fajar Florist", city: "Kota Bogor", category: "Florist & Dekorasi", orders: 142, gmv: "Rp 27,6 jt" },
  { id: 5, name: "Berkah Tani", city: "Kab. Bogor", category: "Pertanian & Perkebunan", orders: 121, gmv: "Rp 21,3 jt" },
];

export function TopTenantsTable() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <CardTitle>Tenant Berkinerja Terbaik</CardTitle>
        </div>
        <Link href="/tenants" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center">
          Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
            <tr>
              <th className="px-5 py-3 w-12 text-center">No</th>
              <th className="px-5 py-3">Tenant</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3 text-right">Pesanan</th>
              <th className="px-5 py-3 text-right">GMV</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-5 py-3 text-center text-neutral-500">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-neutral-900">{row.name}</div>
                  <div className="text-xs text-neutral-500">{row.city}</div>
                </td>
                <td className="px-5 py-3 text-neutral-600">{row.category}</td>
                <td className="px-5 py-3 text-right font-medium">{row.orders}</td>
                <td className="px-5 py-3 text-right font-medium">{row.gmv}</td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Aktif
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
