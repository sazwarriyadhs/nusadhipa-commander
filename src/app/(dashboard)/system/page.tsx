"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.nusadhipa.shop/api/v1"
).replace(/\/+$/, "");

type HealthStatus = "checking" | "online" | "offline";

type CheckResult = {
  key: string;
  title: string;
  endpoint: string;
  status: HealthStatus;
  httpStatus: number | null;
  latency: number | null;
  checkedAt: string | null;
  detail: string;
};

type HistoryItem = {
  id: string;
  time: string;
  title: string;
  result: string;
  ok: boolean;
  latency: number | null;
};

const initialChecks: CheckResult[] = [
  {
    key: "api",
    title: "Application API",
    endpoint: "/health",
    status: "checking",
    httpStatus: null,
    latency: null,
    checkedAt: null,
    detail: "Menunggu pemeriksaan pertama",
  },
  {
    key: "database",
    title: "Database Health Endpoint",
    endpoint: "/health/db",
    status: "checking",
    httpStatus: null,
    latency: null,
    checkedAt: null,
    detail: "Menunggu pemeriksaan pertama",
  },
];

function formatTime(value: string | null) {
  if (!value) return "Belum diperiksa";

  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function formatLatency(value: number | null) {
  return value === null ? "—" : `${value} ms`;
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const styles: Record<HealthStatus, string> = {
    checking: "bg-slate-100 text-slate-600",
    online: "bg-emerald-50 text-emerald-700",
    offline: "bg-red-50 text-red-700",
  };

  const labels: Record<HealthStatus, string> = {
    checking: "MEMERIKSA",
    online: "MERESPONS",
    offline: "GAGAL",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${styles[status]}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "online"
            ? "bg-emerald-500"
            : status === "offline"
              ? "bg-red-500"
              : "animate-pulse bg-slate-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export default function SystemPage() {
  const [checks, setChecks] = useState<CheckResult[]>(initialChecks);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const runChecks = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    setChecks((previous) =>
      previous.map((item) => ({
        ...item,
        status: "checking",
        detail: "Sedang memeriksa endpoint",
      }))
    );

    const endpoints = [
      { key: "api", title: "Application API", path: "/health" },
      {
        key: "database",
        title: "Database Health Endpoint",
        path: "/health/db",
      },
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint): Promise<CheckResult> => {
        const started = Date.now();
        const checkedAt = new Date().toISOString();

        try {
          const response = await fetch(`${API_BASE}${endpoint.path}`, {
            method: "GET",
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
            headers: { Accept: "application/json" },
          });

          const latency = Date.now() - started;
          const ok = response.ok;

          let detail = ok
            ? "Endpoint berhasil merespons HTTP."
            : `Endpoint merespons dengan HTTP ${response.status}.`;

          try {
            const body: unknown = await response.json();

            if (body && typeof body === "object") {
              const data = body as Record<string, unknown>;
              const message =
                typeof data.message === "string"
                  ? data.message
                  : typeof data.status === "string"
                    ? data.status
                    : null;

              if (message) {
                detail = `${detail} ${message}`.slice(0, 240);
              }
            }
          } catch {
            // Respons tidak harus berupa JSON.
          }

          return {
            key: endpoint.key,
            title: endpoint.title,
            endpoint: endpoint.path,
            status: ok ? "online" : "offline",
            httpStatus: response.status,
            latency,
            checkedAt,
            detail,
          };
        } catch (error) {
          const latency = Date.now() - started;
          const detail =
            error instanceof Error &&
            (error.name === "TimeoutError" ||
              error.name === "AbortError")
              ? "Pemeriksaan melewati batas waktu 10 detik."
              : "Tidak dapat mengakses endpoint. Periksa jaringan, CORS, dan API.";

          return {
            key: endpoint.key,
            title: endpoint.title,
            endpoint: endpoint.path,
            status: "offline",
            httpStatus: null,
            latency,
            checkedAt,
            detail,
          };
        }
      })
    );

    const now = new Date().toISOString();

    setChecks(results);
    setLastRefresh(now);

    setHistory((previous) => {
      const newItems = results.map((item, index) => ({
        id: `${now}-${index}`,
        time: now,
        title: item.title,
        result:
          item.httpStatus !== null
            ? `HTTP ${item.httpStatus}`
            : item.detail,
        ok: item.status === "online",
        latency: item.latency,
      }));

      return [...newItems, ...previous].slice(0, 12);
    });

    setLoading(false);
  }, [loading]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const onlineCount = checks.filter(
    (item) => item.status === "online"
  ).length;

  const offlineCount = checks.filter(
    (item) => item.status === "offline"
  ).length;

  const averageLatency = (() => {
    const values = checks
      .map((item) => item.latency)
      .filter((value): value is number => value !== null);

    return values.length
      ? `${Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length
        )} ms`
      : "—";
  })();

  const overallStatus: HealthStatus =
    loading || checks.some((item) => item.status === "checking")
      ? "checking"
      : offlineCount > 0
        ? "offline"
        : onlineCount === checks.length
          ? "online"
          : "checking";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="System Health"
        description="Monitoring respons API, endpoint database, dan pemeriksaan infrastruktur NUSA-DHIPA."
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Overall endpoint status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {overallStatus === "online"
                    ? "All Checks Responding"
                    : overallStatus === "offline"
                      ? "Attention Required"
                      : "Checking Services"}
                </h2>
                <StatusBadge status={overallStatus} />
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Status diambil langsung dari endpoint yang diperiksa oleh
                browser. Ini bukan pengukuran uptime historis atau audit
                menyeluruh seluruh infrastruktur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
            </svg>
            {loading ? "Memeriksa..." : "Refresh Health"}
          </button>
        </div>

        <div className="grid gap-4 bg-slate-50/70 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Endpoints Responding"
            value={`${onlineCount}/${checks.length}`}
            detail="Endpoint dengan respons HTTP sukses"
          />
          <MetricCard
            label="Endpoints Requiring Attention"
            value={offlineCount}
            detail="Endpoint gagal, timeout, atau HTTP non-2xx"
          />
          <MetricCard
            label="Average Response Time"
            value={averageLatency}
            detail="Rata-rata latency pemeriksaan terakhir"
          />
          <MetricCard
            label="Last Health Check"
            value={lastRefresh ? "Recorded" : "Pending"}
            detail={formatTime(lastRefresh)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Service Health
            </h2>
            <p className="text-sm text-slate-500">
              Hasil pemeriksaan endpoint secara langsung.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Timeout per endpoint: 10 detik
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {checks.map((item) => (
            <article
              key={item.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {item.key === "api" ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="6" rx="2" />
                        <rect x="3" y="14" width="18" height="6" rx="2" />
                        <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <ellipse cx="12" cy="5" rx="8" ry="3" />
                        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {item.endpoint}
                    </p>
                  </div>
                </div>

                <StatusBadge status={item.status} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">HTTP Status</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {item.httpStatus ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Response Time</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatLatency(item.latency)}
                  </p>
                </div>
              </div>

              <p className="mt-4 break-words text-sm leading-6 text-slate-600">
                {item.detail}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Last checked: {formatTime(item.checkedAt)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
          aria-expanded={expanded}
        >
          <div>
            <h2 className="font-bold text-slate-900">
              Recent Health Checks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Riwayat pemeriksaan selama halaman ini terbuka.
            </p>
          </div>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            {expanded ? "Sembunyikan" : `Lihat ${history.length} hasil`}
          </span>
        </button>

        {expanded && (
          <div className="overflow-x-auto border-t border-slate-100">
            {history.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                Belum ada hasil pemeriksaan.
              </p>
            ) : (
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Waktu</th>
                    <th className="px-5 py-3 font-semibold">Endpoint</th>
                    <th className="px-5 py-3 font-semibold">Hasil</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatTime(item.time)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {item.title}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            item.ok
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-red-600"
                          }
                        >
                          {item.result}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                        {formatLatency(item.latency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 3 2.8 20h18.4L12 3Z" />
              <path d="M12 9v5m0 3h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">
              Batas pemeriksaan
            </h3>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              HTTP sukses menunjukkan endpoint merespons, bukan jaminan seluruh
              query database, autentikasi, Railway, pembayaran, atau integrasi
              eksternal berfungsi. Hasil disimpan sementara di browser dan
              akan hilang saat halaman ditutup atau dimuat ulang.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:justify-between">
        <span>NUSA-DHIPA System Monitor</span>
        <span className="break-all">API: {API_BASE}</span>
      </footer>
    </div>
  );
}