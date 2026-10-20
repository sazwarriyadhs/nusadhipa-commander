import { cn } from "@/lib/utils"

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden", className)}>{children}</div>
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-5 py-4 border-b border-neutral-100 flex items-center justify-between", className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h3 className={cn("font-semibold text-neutral-900", className)}>{children}</h3>
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>
}
