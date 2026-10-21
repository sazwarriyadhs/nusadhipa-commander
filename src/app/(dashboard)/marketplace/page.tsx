"use client";
import { getAuthHeaders } from "@/lib/auth-token";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import {
  Store,
  Search,
  RefreshCw,
  Package,
  Tags,
  Image as ImageIcon,
  Layers3,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ExternalLink,
  Boxes,
} from "lucide-react";

type JsonRecord = Record<string, unknown>;

type Product = {
  id: number | string;
  name?: string | null;
  title?: string | null;
  sku?: string | null;
  status?: string | null;
  price?: number | string | null;
  category_id?: number | string | null;
  category_name?: string | null;
  business_id?: number | string | null;
  business_name?: string | null;
  variants?: unknown[] | number | null;
  images?: unknown[] | number | null;
  product_variants?: unknown[] | number | null;
  product_images?: unknown[] | number | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type Category = {
  id: number | string;
  name?: string | null;
  [key: string]: unknown;
};

type Business = {
  id: number | string;
  name?: string | null;
  business_name?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

function asRecord(value: unknown): JsonRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function unwrapArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.products)) return root.products;
  if (Array.isArray(root.categories)) return root.categories;
  if (Array.isArray(root.businesses)) return root.businesses;

  const data = asRecord(root.data);
  if (data) {
    for (const key of [
      "items",
      "products",
      "categories",
      "businesses",
      "rows",
    ]) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
  }

  return [];
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function relationCount(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  return readNumber(value);
}

function productName(product: Product) {
  return String(product.name || product.title || "Tanpa nama");
}

function productStatus(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "active":
    case "published":
      return {
        label: "Aktif",
        className: "bg-green-100 text-green-700",
      };
    case "draft":
      return {
        label: "Draft",
        className: "bg-neutral-100 text-neutral-700",
      };
    case "pending":
    case "pending_review":
      return {
        label: "Menunggu Moderasi",
        className: "bg-amber-100 text-amber-700",
      };
    case "rejected":
      return {
        label: "Ditolak",
        className: "bg-red-100 text-red-700",
      };
    case "archived":
      return {
        label: "Diarsipkan",
        className: "bg-neutral-200 text-neutral-700",
      };
    default:
      return {
        label: status || "Belum diketahui",
        className: "bg-neutral-100 text-neutral-600",
      };
  }
}

function formatPrice(value: unknown) {
  const amount = readNumber(value);
  if (amount === null) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function fetchCollection(path: string): Promise<unknown[]> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const body = asRecord(payload);
    throw new Error(
      String(
        body?.message ||
          body?.error ||
          `Permintaan ${path} gagal (HTTP ${response.status})`
      )
    );
  }

  const body = asRecord(payload);
  if (body?.success === false) {
    throw new Error(String(body.message || `API ${path} melaporkan kegagalan.`));
  }

  return unwrapArray(payload);
}

export default function MarketplaceManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Endpoint menggunakan prefix /api/v1 yang sama dengan konfigurasi API.
      // Jika backend memakai path berbeda, sesuaikan endpoint dengan route
      // yang benar-benar terdaftar di server.js.
      const [productRows, categoryRows, businessRows] = await Promise.all([
        fetchCollection("/products"),
        fetchCollection("/categories"),
        fetchCollection("/businesses"),
      ]);

      setProducts(
        productRows.filter((item): item is Product => {
          const row = asRecord(item);
          return row !== null && (typeof row.id === "string" || typeof row.id === "number");
        })
      );

      setCategories(
        categoryRows.filter((item): item is Category => {
          const row = asRecord(item);
          return row !== null && (typeof row.id === "string" || typeof row.id === "number");
        })
      );

      setBusinesses(
        businessRows.filter((item): item is Business => {
          const row = asRecord(item);
          return row !== null && (typeof row.id === "string" || typeof row.id === "number");
        })
      );

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setProducts([]);
      setCategories([]);
      setBusinesses([]);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data marketplace dari API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketplace();
  }, [loadMarketplace]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        [
          productName(product),
          product.sku,
          product.category_name,
          product.business_name,
          product.status,
          product.id,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(keyword)
        );

      const status = (product.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          ["active", "published"].includes(status)) ||
        (statusFilter === "draft" && status === "draft") ||
        (statusFilter === "pending" &&
          ["pending", "pending_review"].includes(status)) ||
        (statusFilter === "rejected" && status === "rejected") ||
        (statusFilter === "archived" && status === "archived");

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const activeCount = products.filter((product) =>
    ["active", "published"].includes((product.status || "").toLowerCase())
  ).length;

  const pendingCount = products.filter((product) =>
    ["pending", "pending_review"].includes((product.status || "").toLowerCase())
  ).length;

  const draftCount = products.filter(
    (product) => (product.status || "").toLowerCase() === "draft"
  ).length;

  const variantCount = products.reduce((total, product) => {
    const count = relationCount(
      product.variants ?? product.product_variants
    );
    return total + (count ?? 0);
  }, 0);

  const imageCount = products.reduce((total, product) => {
    const count = relationCount(product.images ?? product.product_images);
    return total + (count ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Management"
        description="Pengelolaan katalog produk, SKU, variasi, foto, kategori, toko, dan moderasi marketplace NUSA-DHIPA."
        icon={Store}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-50 p-3 text-red-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Produk</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : products.length}
              </p>
              <p className="text-xs text-neutral-500">Data dari API</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Produk Aktif</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : activeCount}
              </p>
              <p className="text-xs text-neutral-500">Aktif / published</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Menunggu Moderasi</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : pendingCount}
              </p>
              <p className="text-xs text-neutral-500">Perlu ditinjau</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-neutral-100 p-3 text-neutral-700">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Toko / Bisnis</p>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "…" : businesses.length}
              </p>
              <p className="text-xs text-neutral-500">Terdaftar di API</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-neutral-100 p-3 text-neutral-700">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Kategori</p>
              <p className="text-xl font-bold text-neutral-900">
                {loading ? "…" : categories.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-neutral-100 p-3 text-neutral-700">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Variasi Terdata</p>
              <p className="text-xl font-bold text-neutral-900">
                {loading ? "…" : variantCount}
              </p>
              <p className="text-xs text-neutral-500">
                Hanya dari relasi yang disertakan API
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-neutral-100 p-3 text-neutral-700">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Foto Terdata</p>
              <p className="text-xl font-bold text-neutral-900">
                {loading ? "…" : imageCount}
              </p>
              <p className="text-xs text-neutral-500">
                Hanya dari relasi yang disertakan API
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-neutral-100 bg-neutral-50 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk, SKU, kategori, atau toko..."
              aria-label="Cari produk marketplace"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter status produk"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="pending">Menunggu Moderasi</option>
              <option value="rejected">Ditolak</option>
              <option value="archived">Diarsipkan</option>
            </select>

            <span className="whitespace-nowrap text-sm text-neutral-500">
              {loading
                ? "Memuat data..."
                : `${filteredProducts.length} dari ${products.length} produk`}
            </span>

            <button
              type="button"
              onClick={() => void loadMarketplace()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">Gagal memuat data marketplace</p>
            <p className="mt-1 break-words">{error}</p>
            <p className="mt-2 text-xs">
              Periksa endpoint produk, kategori, dan bisnis pada API. Halaman
              ini belum melakukan perubahan data.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Produk
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  SKU
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Kategori
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Toko / Bisnis
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Harga
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Variasi
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Foto
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Status
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Dibuat
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Mengambil katalog dari API...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    Data belum dapat ditampilkan karena permintaan API gagal.
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    {products.length === 0
                      ? "API belum mengembalikan data produk."
                      : "Tidak ada produk yang cocok dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = productStatus(product.status);
                  const variants = relationCount(
                    product.variants ?? product.product_variants
                  );
                  const images = relationCount(
                    product.images ?? product.product_images
                  );

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-neutral-50"
                    >
                      <td className="min-w-48 px-5 py-4">
                        <p className="font-semibold text-neutral-900">
                          {productName(product)}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          ID: {product.id}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                        {product.sku || "-"}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {product.category_name ||
                          (product.category_id != null
                            ? `ID ${product.category_id}`
                            : "-")}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {product.business_name ||
                          (product.business_id != null
                            ? `ID ${product.business_id}`
                            : "-")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-700">
                        {formatPrice(product.price)}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {variants === null ? "-" : variants}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {images === null ? "-" : images}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-500">
                        {formatDate(product.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Draft: {loading ? "…" : draftCount} · Kategori:{" "}
            {loading ? "…" : categories.length}
          </p>
          <p>
            Pembaruan terakhir:{" "}
            {lastUpdated ? formatDate(lastUpdated) : "-"}
          </p>
        </div>
      </Card>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-neutral-900">
              Catatan integrasi API
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Ringkasan variasi dan foto dihitung dari relasi yang dikirim
              endpoint produk. Jika API hanya mengirim produk tanpa relasi
              variasi atau foto, kolom tersebut menampilkan tanda "-", bukan
              angka perkiraan. Halaman ini bersifat baca data; belum
              menjalankan aksi edit, hapus, atau moderasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
