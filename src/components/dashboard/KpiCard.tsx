import { Card } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
}

export function KpiCard({ title, value, trend, icon: Icon }: KpiCardProps) {
  const isPositive = trend >= 0;

  return (
    <Card className="p-4 md:p-5 rounded-xl border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-brand-600">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-neutral-600">{title}</span>
      </div>
      <div className="text-2xl font-bold text-neutral-900 mb-2">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex items-center font-medium ${isPositive ? "text-green-600" : "text-brand-600"}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-neutral-400">vs periode sebelumnya</span>
      </div>
    </Card>
  );
}
