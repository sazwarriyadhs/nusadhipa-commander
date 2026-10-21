
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

type HealthState = {
  label: string;
  detail: string;
  state: "checking" | "ok" | "error";
};

async function checkEndpoint(path: string): Promise<HealthState> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        label: path,
        detail: `Endpoint merespons HTTP ${response.status}.`,
        state: "error",
      };
    }

    return {
      label: path,
      detail: `Endpoint merespons HTTP ${response.status}.`,
      state: "ok",
    };
  } catch {
    return {
      label: path,
      detail: "Tidak dapat mengakses endpoint dari browser.",
      state: "error",
    };
  }
}

function StateBadge({ state }: { state: HealthState["state"] }) {
  const style =
    state === "ok"
      ? "bg-green-50 text-green-700"
      : state === "error"
        ? "bg-red-50 text-red-700"
        : "bg-gray-100 text-gray-600";

  const label =
    state === "ok"
      ? "Merespons"
      : state === "error"
        ? "Gagal"
        : "Memeriksa";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export function SystemHealth() {
  const [items, setItems] = useState<HealthState[]>([
    {
      label: "/health",
      detail: "Memeriksa API…",
      state: "checking",
    },
    {
      label: "/health/db",
      detail: "Memeriksa endpoint kesehatan database…",
      state: "checking",
    },
  ]);

  const [checking, setChecking] = useState(false);

  async function refreshHealth() {
    setChecking(true);

    const results = await Promise.all([
      checkEndpoint("/health"),
      checkEndpoint("/health/db"),
    ]);

    setItems(results);
    setChecking(false);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const results = await Promise.all([
        checkEndpoint("/health"),
        checkEndpoint("/health/db"),
      ]);

      if (active) {
        setItems(results);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const failed = items.filter((item) => item.state === "error").length;
  const pending = items.some((item) => item.state === "checking");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Kesehatan Layanan</CardTitle>
          <button
            type="button"
            onClick={refreshHealth}
            disabled={checking}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Memeriksa…" : "Periksa ulang"}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Pemeriksaan langsung endpoint dari browser pengguna.
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900">
                  {item.label}
                </div>
                <p className="mt-1 break-words text-xs text-gray-500">
                  {item.detail}
                </p>
              </div>
              <StateBadge state={item.state} />
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">
          {pending
            ? "Pemeriksaan sedang berlangsung."
            : failed === 0
              ? "Kedua endpoint merespons. Ini tidak mengukur uptime historis, antrean pekerjaan, atau kesehatan layanan pembayaran."
              : `${failed} endpoint gagal diperiksa. Periksa konektivitas API, CORS, dan log server.`}
        </div>
      </CardContent>
    </Card>
  );
}

export function AiInsight() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Business Insight</CardTitle>
        <p className="text-sm text-gray-500">
          Analisis bisnis berbasis data terverifikasi.
        </p>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="font-semibold text-amber-900">
            Insight otomatis belum tersedia
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Belum ada hasil analisis AI terverifikasi yang tersedia untuk
            ditampilkan. Klaim pertumbuhan penjualan dan rekomendasi ekspansi
            tidak ditampilkan sampai ada sumber data dan proses analisis yang
            dapat diperiksa.
          </p>
        </div>

        <Link
          href="/ai"
          className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Buka modul AI
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
