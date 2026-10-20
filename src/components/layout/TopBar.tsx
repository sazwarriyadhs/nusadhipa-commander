"use client";
import { Search, Bell, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shrink-0">
      {/* KIRI: Breadcrumb */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="text-sm text-neutral-500 font-medium hidden sm:block">
          Command Center / <span className="text-neutral-900 font-semibold">Overview</span>
        </div>
      </div>

      {/* TENGAH: Search Bar */}
      <div className="flex-1 max-w-md mx-2 md:mx-6 hidden sm:block">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 absolute left-3 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Cari tenant, produk, order..." 
            className="w-full pl-9 pr-12 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <div className="absolute right-2 text-[10px] font-medium text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 bg-white">
            Ctrl + K
          </div>
        </div>
      </div>

      {/* KANAN: Notif & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </button>
        <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-neutral-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src="" alt="User" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://ui-avatars.com/api/?name=Superadmin&background=C41E1E&color=fff&bold=true'} />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-semibold text-neutral-900 leading-tight">Superadmin</p>
            <p className="text-xs text-neutral-500">Platform Owner</p>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
}

