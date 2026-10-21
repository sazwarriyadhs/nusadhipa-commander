"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, Store, ShoppingBag, ShoppingCart, Wallet, Scale, Truck, Bike,
  Brain, MapPin, Users, Headphones, Activity, FileText, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Command Center",
    items: [
      { name: "Overview", href: "/overview", icon: Home },
      { name: "Tenant & Business", href: "/tenants", icon: Store },
      { name: "Couriers", href: "/couriers", icon: Bike },
      { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "Finance", href: "/finance", icon: Wallet },
      { name: "Legalitas & KBLI", href: "/legal", icon: Scale },
      { name: "Logistics", href: "/logistics", icon: Truck },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { name: "AI Intelligence", href: "/ai", icon: Brain },
      { name: "Regional UMKM", href: "/regional", icon: MapPin },
    ]
  },
  {
    label: "System",
    items: [
      { name: "Users & Access", href: "/users", icon: Users },
      { name: "Support", href: "/support", icon: Headphones },
      { name: "System Health", href: "/system", icon: Activity },
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-white border-r border-neutral-200 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Tombol Toggle Collapse */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-neutral-200 rounded-full p-1 text-neutral-500 hover:text-brand-600 shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo Area */}
      <div className={cn(
        "h-[76px] flex items-center border-b border-neutral-200 shrink-0 transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "px-6 justify-start"
      )}>
        <Link href="/overview" className="flex items-center justify-center">
          <img
            src="/images/logo_nusadhipa.png"
            alt="NUSA-DHIPA"
            className={cn(
              "object-contain transition-all duration-300",
              isCollapsed ? "h-9 w-9" : "h-10 w-auto max-w-[210px]"
            )}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="text-brand-600 font-bold tracking-widest text-lg hidden">NUSA-DHIPA</span>
        </Link>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent overflow-x-hidden">
        {NAV_ITEMS.map((group, i) => (
          <div key={i}>
            <p className={cn(
              "px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 transition-opacity duration-300",
              isCollapsed ? "opacity-0 hidden" : "opacity-100 block"
            )}>
              {group.label}
            </p>

            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed ? "justify-center px-0 py-3" : "px-3 py-2.5 gap-3",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-neutral-500")} />
                    <span className={cn(
                      "truncate transition-opacity duration-300",
                      isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 block"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Sidebar */}
      <div className={cn(
        "p-4 border-t border-neutral-200 shrink-0 text-center transition-all duration-300 flex items-center",
        isCollapsed ? "justify-center" : "justify-start"
      )}>
        <p className="text-[10px] text-neutral-400 font-mono">
          {isCollapsed ? "v1.0" : "v1.0.0 • Commander"}
        </p>
      </div>
    </aside>
  );
}
