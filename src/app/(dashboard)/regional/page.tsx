"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAuthHeaders } from "@/lib/auth-token";

type Tenant = {
  id: number | string;
  business_name?: string;
  legal_name?: string | null;
  slug?: string;
  logo_url?: string | null;
  business_type?: string;
  status?: string;
  verification_status?: string;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

const INDONESIA_CENTER: [number, number] = [-2.5, 118];
const INDONESIA_ZOOM = 5;

function getTenantName(tenant: Tenant) {
  return tenant.business_name || tenant.legal_name || "Tenant tanpa nama";
}

function getCoordinates(tenant: Tenant): [number, number] | null {
  const lat = Number(tenant.latitude);
  const lng = Number(tenant.longitude);

  if (
    tenant.latitude == null ||
    tenant.longitude == null ||
    tenant.latitude === "" ||
    tenant.longitude === "" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -11.5 ||
    lat > 6.5 ||
    lng < 94 ||
    lng > 142
  ) {
    return null;
  }

  return [lat, lng];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Page() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("all");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [mapError, setMapError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapModule, setMapModule] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function loadMapLibrary() {
      try {
        const leaflet = await import("leaflet");
        if (!active) return;
        setMapModule(leaflet.default || leaflet);
        setMapReady(true);
      } catch {
        if (active) {
          setMapError(
            "Library peta Leaflet belum tersedia. Jalankan npm install leaflet dan npm install -D @types/leaflet."
          );
        }
      }
    }

    void loadMapLibrary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/admin/tenants`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Sesi tidak valid atau akses superadmin diperlukan. Silakan login kembali."
            );
          }
          throw new Error(`Gagal mengambil tenant (HTTP ${response.status}).`);
        }

        const result = await response.json();
        const payload = result?.data;
        const rows: Tenant[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.tenants)
            ? payload.tenants
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        if (!Array.isArray(payload) &&
            !Array.isArray(payload?.tenants) &&
            !Array.isArray(payload?.items)) {
          throw new Error("Format daftar tenant dari API tidak dikenali.");
        }

        if (active) setTenants(rows);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat tenant."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTenants();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const provinces = useMemo(
    () =>
      Array.from(
        new Set(
          tenants.map((tenant) => tenant.province?.trim()).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b), "id")),
    [tenants]
  );

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tenants.filter((tenant) => {
      const matchesProvince =
        province === "all" || tenant.province?.trim() === province;

      const searchable = [
        tenant.business_name,
        tenant.legal_name,
        tenant.slug,
        tenant.city,
        tenant.province,
        tenant.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesProvince && (!query || searchable.includes(query));
    });
  }, [tenants, search, province]);

  const mappedTenants = useMemo(
    () =>
      filteredTenants
        .map((tenant) => ({
          tenant,
          coordinates: getCoordinates(tenant),
        }))
        .filter(
          (item): item is { tenant: Tenant; coordinates: [number, number] } =>
            item.coordinates !== null
        ),
    [filteredTenants]
  );

  const selectedTenant = filteredTenants.find(
    (tenant) => String(tenant.id) === String(selectedId)
  );

  const selectTenant = useCallback((tenant: Tenant) => {
    setSelectedId(tenant.id);
    const coords = getCoordinates(tenant);
    if (coords) {
      window.dispatchEvent(
        new CustomEvent("nusadhipa-map-focus", {
          detail: { id: String(tenant.id), coordinates: coords },
        })
      );
    }
  }, []);

  useEffect(() => {
    if (!mapReady || !mapModule) return;

    let active = true;
    let map: any;
    let layer: any;
    let observer: ResizeObserver | undefined;
    const markerLayers: any[] = [];

    async function buildMap() {
      const L = mapModule;
      const container = document.getElementById("nusadhipa-indonesia-map");
      if (!container || !active) return;

      try {
        const existing = (container as any)._leaflet_id;
        if (existing) {
          setMapError("Peta sedang diperbarui. Silakan muat ulang halaman jika peta belum muncul.");
          return;
        }

        map = L.map(container, {
          center: INDONESIA_CENTER,
          zoom: INDONESIA_ZOOM,
          minZoom: 4,
          maxZoom: 18,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        layer = L.layerGroup().addTo(map);

        for (const item of mappedTenants) {
          if (!active) return;

          const tenant = item.tenant;
          const name = getTenantName(tenant);
          const logo = tenant.logo_url;
          const iconHtml = logo
            ? `<div style="width:42px;height:42px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 9px #0005;background:#fff;overflow:hidden"><img src="${String(logo).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}" alt="" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none';this.parentElement.style.background='#b91c1c'"/></div>`
            : `<div style="width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 9px #0005;background:#b91c1c;color:#fff;font-weight:800;font-size:12px">${getInitials(name)}</div>`;

          const icon = L.divIcon({
            className: "nusadhipa-tenant-marker",
            html: iconHtml,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });

          const marker = L.marker(item.coordinates, { icon }).addTo(layer);

          const popup = document.createElement("div");
          popup.style.minWidth = "180px";

          const title = document.createElement("strong");
          title.textContent = name;
          title.style.display = "block";
          title.style.marginBottom = "5px";

          const location = document.createElement("div");
          location.textContent = [tenant.city, tenant.province]
            .filter(Boolean)
            .join(", ") || "Lokasi administratif belum diisi";
          location.style.fontSize = "12px";

          const action = document.createElement("button");
          action.type = "button";
          action.textContent = "Lihat tenant";
          action.style.cssText =
            "margin-top:9px;padding:6px 10px;border:0;border-radius:6px;background:#b91c1c;color:white;cursor:pointer;font-weight:600";
          action.addEventListener("click", () => {
            if (active) setSelectedId(tenant.id);
          });

          popup.append(title, location, action);
          marker.bindPopup(popup);
          marker.on("click", () => {
            if (active) setSelectedId(tenant.id);
          });

          markerLayers.push({ marker, id: String(tenant.id) });
        }

        const focusHandler = (event: Event) => {
          const detail = (event as CustomEvent).detail;
          if (!detail || !map) return;
          map.flyTo(detail.coordinates, 14, { duration: 0.7 });
          const found = markerLayers.find((entry) => entry.id === detail.id);
          if (found) found.marker.openPopup();
        };

        window.addEventListener("nusadhipa-map-focus", focusHandler);

        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(container);

        setMapError("");

        return () => {
          window.removeEventListener("nusadhipa-map-focus", focusHandler);
        };
      } catch (err) {
        if (active) {
          setMapError(
            err instanceof Error ? err.message : "Gagal menampilkan peta."
          );
        }
      }
    }

    let removeListener: (() => void) | undefined;
    void buildMap().then((cleanup) => {
      removeListener = cleanup;
    });

    return () => {
      active = false;
      removeListener?.();
      observer?.disconnect();
      if (map) map.remove();
    };
  }, [mapReady, mapModule, mappedTenants]);

  const withCoordinates = tenants.filter(
    (tenant) => getCoordinates(tenant) !== null
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regional & UMKM Intelligence"
        description="Peta persebaran tenant seluruh Indonesia, analisis wilayah, dan peluang ekspansi NUSA-DHIPA."
      />

      <style jsx global>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .nusadhipa-tenant-marker {
          background: transparent;
          border: 0;
        }
        #nusadhipa-indonesia-map {
          z-index: 0;
          background: #eaf0f4;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
        }
      `}</style>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Tenant", value: tenants.length },
          { label: "Tenant Berkoordinat", value: withCoordinates },
          { label: "Belum Ada Koordinat", value: tenants.length - withCoordinates },
          { label: "Wilayah Provinsi", value: provinces.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? "—" : item.value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Gagal memuat tenant.</strong>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="mt-3 rounded-md bg-red-700 px-3 py-2 font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 className="font-bold text-gray-900">Peta Indonesia</h2>
            <p className="mt-1 text-xs text-gray-500">
              OpenStreetMap · Marker menggunakan logo tenant jika tersedia
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const mapContainer = document.getElementById("nusadhipa-indonesia-map");
              if (mapContainer) {
                window.dispatchEvent(
                  new CustomEvent("nusadhipa-map-focus", {
                    detail: { coordinates: INDONESIA_CENTER, id: "" },
                  })
                );
              }
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Fokus Indonesia
          </button>
        </div>

        <div
          id="nusadhipa-indonesia-map"
          className="h-[480px] w-full sm:h-[600px]"
          aria-label="Peta persebaran tenant NUSA-DHIPA di Indonesia"
        />

        {mapError && (
          <div className="border-t border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {mapError}
          </div>
        )}

        {!mapReady && !mapError && (
          <p className="p-4 text-sm text-gray-500">Memuat pustaka peta...</p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
          <span>● Pin memakai logo tenant atau inisial</span>
          <span>● Klik pin untuk melihat informasi tenant</span>
          <span>● Lokasi berdasarkan koordinat database</span>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama tenant, kota, atau provinsi..."
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
          />
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="all">Semua Provinsi</option>
            {provinces.map((item) => (
              <option key={item} value={item as string}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setProvince("all");
              setSelectedId(null);
            }}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset Filter
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-gray-900">Daftar tenant Indonesia</h2>
          <span className="text-sm text-gray-500">
            {filteredTenants.length} tenant · {mappedTenants.length} marker
          </span>
        </div>

        {selectedTenant && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Tenant dipilih
            </p>
            <p className="mt-1 font-bold text-gray-900">
              {getTenantName(selectedTenant)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {[selectedTenant.address, selectedTenant.city, selectedTenant.province]
                .filter(Boolean)
                .join(", ") || "Alamat belum tersedia"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Status: {selectedTenant.verification_status || "belum diverifikasi"}
            </p>
          </div>
        )}

        <div className="mt-4 divide-y divide-gray-100">
          {loading && (
            <p className="py-8 text-center text-sm text-gray-500">
              Memuat daftar tenant...
            </p>
          )}

          {!loading && filteredTenants.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              Tidak ada tenant yang cocok dengan filter.
            </p>
          )}

          {!loading &&
            filteredTenants.map((tenant) => {
              const name = getTenantName(tenant);
              const coordinates = getCoordinates(tenant);
              const isSelected = String(selectedId) === String(tenant.id);

              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => selectTenant(tenant)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-4 text-left transition hover:bg-gray-50 ${
                    isSelected ? "bg-red-50 ring-1 ring-red-200" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt={`Logo ${name}`}
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-red-700">
                        {getInitials(name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {name}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {[tenant.city, tenant.province].filter(Boolean).join(", ") ||
                        "Wilayah belum diisi"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {coordinates
                        ? `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`
                        : "Koordinat belum tersedia"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      coordinates
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {coordinates ? "Di peta" : "Tanpa pin"}
                  </span>
                </button>
              );
            })}
        </div>
      </section>

      <p className="text-xs leading-5 text-gray-500">
        Data tenant berasal dari API NUSA-DHIPA. Cakupan peta mengikuti tenant
        yang tersedia pada API, bukan otomatis seluruh UMKM Indonesia.
        Peta dasar © OpenStreetMap contributors.
      </p>
    </div>
  );
}