
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown, UserRound } from "lucide-react";

const AVATAR_URL =
  "https://ui-avatars.com/api/?name=Superadmin&background=C41E1E&color=fff&bold=true";

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[segments.length - 1] || "overview";

  const titles: Record<string, string> = {
    overview: "Overview",
    tenants: "Tenant",
    products: "Produk",
    orders: "Pesanan",
    couriers: "Kurir",
    finance: "Keuangan",
    marketplace: "Marketplace",
    logistics: "Logistik",
    legal: "Legalitas",
    regional: "Regional",
    reports: "Laporan",
    users: "Pengguna",
    settings: "Pengaturan",
    support: "Dukungan",
    system: "Sistem",
    ai: "AI Intelligence",
  };

  return titles[current] ?? current.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopBar() {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const pageTitle = getPageTitle(pathname || "/overview");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        searchRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();
    if (!query) {
      searchRef.current?.focus();
      return;
    }

    // Arahkan pencarian ke halaman tenant dengan kata kunci.
    // Halaman tujuan perlu membaca parameter "q" agar hasilnya terfilter.
    window.location.href = `/tenants?q=${encodeURIComponent(query)}`;
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <div className="hidden text-sm font-medium text-neutral-500 sm:block">
          Command Center
          <span className="mx-2 text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">{pageTitle}</span>
        </div>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="mx-2 hidden max-w-md flex-1 sm:block md:mx-6"
      >
        <div className="relative flex w-full items-center">
          <Search
            aria-hidden="true"
            className="absolute left-3 h-4 w-4 text-neutral-400"
          />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari tenant, produk, order..."
            aria-label="Cari tenant, produk, atau pesanan"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-16 text-sm transition-all focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
          <span className="pointer-events-none absolute right-2 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
            {typeof navigator !== "undefined" &&
            /Mac|iPhone|iPad/.test(navigator.platform)
              ? "⌘ K"
              : "Ctrl K"}
          </span>
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        <button
          type="button"
          aria-label="Notifikasi"
          title="Notifikasi"
          className="relative rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden h-8 w-px bg-neutral-200 sm:block" />

        <button
          type="button"
          aria-label="Profil Superadmin"
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-neutral-50 md:gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-100 md:h-9 md:w-9">
            {avatarFailed ? (
              <UserRound
                aria-label="Avatar pengguna"
                className="h-5 w-5 text-red-700"
              />
            ) : (
              <img
                src={AVATAR_URL}
                alt="Superadmin"
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            )}
          </div>

          <div className="hidden text-left text-sm md:block">
            <p className="font-semibold leading-tight text-neutral-900">
              Superadmin
            </p>
            <p className="text-xs text-neutral-500">Platform Owner</p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-neutral-400 md:block" />
        </button>
      </div>
    </header>
  );
}
