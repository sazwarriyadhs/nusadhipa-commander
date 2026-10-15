"use client";

import { useMemo, useState } from "react";

type Shipment = {
  code: string;
  order: string;
  tenant: string;
  customer: string;
  courier: string;
  service: string;
  status: string;
  origin: string;
  destination: string;
  updated: string;
  eta: string;
  tracking: string;
  amount: number;
};

const initialShipments: Shipment[] = [
  { code: "SHP-26014", order: "ORD-10214", tenant: "Sauri Fresh Chicken", customer: "Pelanggan Bogor", courier: "Kurir internal", service: "Same-day", status: "Menunggu pickup", origin: "Bogor Timur", destination: "Bogor Tengah", updated: "Belum dijemput", eta: "Menunggu konfirmasi", tracking: "-", amount: 18000 },
  { code: "SHP-26013", order: "ORD-10213", tenant: "Toko Ayam Fresh Jaya", customer: "Pelanggan Jakarta", courier: "Mitra kurir", service: "Reguler", status: "Dalam perjalanan", origin: "Jakarta Selatan", destination: "Jakarta Pusat", updated: "Data simulasi", eta: "Belum dikonfirmasi", tracking: "DEMO-26013", amount: 22000 },
  { code: "SHP-26012", order: "ORD-10212", tenant: "Sauri Fresh Chicken", customer: "Pelanggan Depok", courier: "Mitra kurir", service: "Same-day", status: "Terkirim", origin: "Bogor Timur", destination: "Depok", updated: "Data simulasi", eta: "Selesai (simulasi)", tracking: "DEMO-26012", amount: 25000 },
  { code: "SHP-26011", order: "ORD-10211", tenant: "Tenant Demo", customer: "Pelanggan Bogor", courier: "Belum ditentukan", service: "Belum dipilih", status: "Perlu dispatch", origin: "Bogor", destination: "Bogor", updated: "Menunggu penugasan", eta: "Belum tersedia", tracking: "-", amount: 0 },
  { code: "SHP-26010", order: "ORD-10210", tenant: "Tenant Demo", customer: "Pelanggan Bekasi", courier: "Mitra kurir", service: "Reguler", status: "Bermasalah", origin: "Jakarta Timur", destination: "Bekasi", updated: "Data simulasi", eta: "Perlu pemeriksaan", tracking: "DEMO-26010", amount: 24000 },
  { code: "SHP-26009", order: "ORD-10209", tenant: "Tenant Demo", customer: "Pelanggan Bogor", courier: "Kurir internal", service: "Pickup", status: "Retur", origin: "Bogor", destination: "Bogor", updated: "Data simulasi", eta: "Perlu tindak lanjut", tracking: "DEMO-26009", amount: 12000 }
];

const navigation = [
  { group: "OVERVIEW", items: [{ name: "Executive Overview", icon: "▦" }] },
  { group: "OPERATIONS", items: [
    { name: "User Management", icon: "♙" },
    { name: "Tenant Management", icon: "▤" },
    { name: "Marketplace Operations", icon: "▣" },
    { name: "Shipping Management", icon: "↗" },
    { name: "Payments & Settlement", icon: "◈" }
  ]},
  { group: "GOVERNANCE", items: [
    { name: "Security & Audit", icon: "⬡" },
    { name: "Platform Settings", icon: "⚙" }
  ]}
];

const filters = ["Semua", "Perlu dispatch", "Menunggu pickup", "Dalam perjalanan", "Terkirim", "Bermasalah", "Retur"];

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(value);
}

function statusClass(status: string) {
  if (status === "Terkirim") return "status delivered";
  if (status === "Dalam perjalanan") return "status transit";
  if (status === "Bermasalah" || status === "Retur") return "status problem";
  if (status === "Menunggu pickup" || status === "Perlu dispatch") return "status waiting";
  return "status";
}

export default function HomePage() {
  const [active, setActive] = useState("Shipping Management");
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [shipments, setShipments] = useState(initialShipments);
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => shipments.filter((s) => {
    const matchesStatus = filter === "Semua" || s.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = [s.code, s.order, s.tenant, s.customer, s.courier, s.destination]
      .some((v) => v.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }), [shipments, filter, search]);

  const count = (status: string) => shipments.filter((s) => s.status === status).length;

  function exportCsv() {
    const header = ["Shipment", "Order", "Tenant", "Customer", "Courier", "Service", "Status", "Origin", "Destination", "Tracking", "Shipping cost"];
    const lines = rows.map(s => [s.code, s.order, s.tenant, s.customer, s.courier, s.service, s.status, s.origin, s.destination, s.tracking, s.amount]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nusadhipa-shipping-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div><strong>NUSA-DHIPA</strong><span>WEB COMMANDER</span></div>
        </div>
        <div className="workspace-tag"><span className="red-dot" /> OWNER WORKSPACE</div>
        <nav className="navigation">
          {navigation.map(group => (
            <div key={group.group}>
              <div className="nav-label">{group.group}</div>
              {group.items.map(item => (
                <button key={item.name} className={`nav-item ${active === item.name ? "selected" : ""}`}
                  onClick={() => { setActive(item.name); setNotice(""); }}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.name}</span>
                  {active === item.name && <span className="nav-dot" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-mark">◆</div>
          <div><strong>Restricted workspace</strong><span>Owner / Superadmin only</span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div><div className="eyebrow">NUSA-DHIPA / CONTROL CENTER</div><div className="top-title">{active}</div></div>
          <div className="top-right">
            <span className="environment"><i /> DEMO DATA</span>
            <div className="avatar">SA</div>
          </div>
        </header>

        <div className="content">
          {active !== "Shipping Management" ? (
            <section className="placeholder-page">
              <div className="placeholder-icon">◫</div>
              <div className="eyebrow">PLATFORM MODULE</div>
              <h1>{active}</h1>
              <p>Menu sudah terdaftar dalam navigasi Web Commander. Halaman operasional modul ini akan dibangun setelah kontrak API dan hak aksesnya diverifikasi.</p>
              <button className="primary-button" onClick={() => setActive("Shipping Management")}>Buka Shipping Management →</button>
            </section>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">LOGISTICS OPERATIONS / PLATFORM-WIDE</div>
                  <h1>Shipping Management</h1>
                  <p>Pusat kendali pengiriman, dispatch, tracking, kurir, retur, dan SLA lintas tenant.</p>
                </div>
                <button className="secondary-button" onClick={exportCsv}>↓ Export CSV</button>
              </div>

              <div className="demo-warning"><span>!</span><div><strong>MODE DEMO — BUKAN DATA LIVE</strong><p>Data contoh hanya untuk menguji tampilan. Tidak ada status pesanan atau pengiriman nyata yang diubah.</p></div></div>

              <section className="metrics">
                <article className="metric-card"><div className="metric-top"><span>Total shipment demo</span><span>01</span></div><strong>{shipments.length}</strong><p>Seluruh contoh pengiriman</p></article>
                <article className="metric-card"><div className="metric-top"><span>Perlu dispatch</span><span>02</span></div><strong>{count("Perlu dispatch")}</strong><p>Belum ditugaskan</p></article>
                <article className="metric-card"><div className="metric-top"><span>Dalam perjalanan</span><span>03</span></div><strong>{count("Dalam perjalanan")}</strong><p>Contoh status transit</p></article>
                <article className="metric-card"><div className="metric-top"><span>Perlu perhatian</span><span>04</span></div><strong>{count("Bermasalah") + count("Retur")}</strong><p>Masalah dan retur demo</p></article>
              </section>

              <div className="shipping-grid">
                <section className="panel shipment-panel">
                  <div className="panel-heading">
                    <div><h2>Shipment control center</h2><p>Daftar pengiriman lintas tenant</p></div>
                    <span className="record-count">{rows.length} RECORD</span>
                  </div>
                  <div className="toolbar">
                    <div className="search-box"><span>⌕</span><input aria-label="Cari pengiriman" placeholder="Cari shipment, order, tenant..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <button className="secondary-button compact" onClick={() => { setSearch(""); setFilter("Semua"); }}>Reset</button>
                  </div>
                  <div className="filter-row">
                    {filters.map(f => <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>SHIPMENT / ORDER</th><th>TENANT</th><th>DESTINASI</th><th>KURIR / LAYANAN</th><th>STATUS</th><th>BIAYA</th><th></th></tr></thead>
                      <tbody>
                        {rows.map(s => <tr key={s.code}>
                          <td><strong className="shipment-code">{s.code}</strong><span className="sub-cell">{s.order}</span></td>
                          <td>{s.tenant}</td><td>{s.destination}<span className="sub-cell">Dari: {s.origin}</span></td>
                          <td>{s.courier}<span className="sub-cell">{s.service}</span></td>
                          <td><span className={statusClass(s.status)}>{s.status}</span></td>
                          <td className="cost">{money(s.amount)}</td>
                          <td><button className="detail-button" onClick={() => setSelected(s)} aria-label={`Lihat ${s.code}`}>↗</button></td>
                        </tr>)}
                        {rows.length === 0 && <tr><td colSpan={7} className="empty-row">Tidak ada pengiriman yang cocok dengan filter.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="table-foot"><span>Data demonstrasi · {rows.length} baris ditampilkan</span><span>Filter: {filter}</span></div>
                </section>

                <section className="panel side-panel">
                  <div className="panel-heading"><div><h2>Logistics modules</h2><p>Komponen operasional pengiriman</p></div></div>
                  {[
                    ["↗", "Dispatch & Fulfillment", "Antrean pickup dan penugasan", "Belum terhubung"],
                    ["⌖", "Courier Management", "Mitra, tarif, dan wilayah layanan", "Belum terhubung"],
                    ["◎", "Tracking & Exceptions", "Timeline, gagal antar, dan bukti", "Belum terhubung"],
                    ["↩", "Returns Management", "Retur, alasan, dan tindak lanjut", "Belum terhubung"],
                    ["◷", "SLA Monitoring", "Estimasi, keterlambatan, eskalasi", "Belum terhubung"]
                  ].map(([icon, title, desc, state]) => <div className="logistics-item" key={title}>
                    <div className="logistics-icon">{icon}</div><div className="logistics-copy"><strong>{title}</strong><span>{desc}</span><small>{state}</small></div><span className="module-arrow">→</span>
                  </div>)}
                  <div className="integration-note"><strong>API integration checklist</strong><p>Verifikasi tabel shipments, orders, tenant ownership, courier integration, tracking events, dan otorisasi sebelum mengaktifkan perubahan status.</p></div>
                </section>
              </div>

              <section className="panel dispatch-panel">
                <div className="panel-heading"><div><h2>Dispatch queue</h2><p>Pengiriman demo yang membutuhkan penugasan</p></div><span className="pill">{count("Perlu dispatch")} PENDING</span></div>
                <div className="dispatch-content">
                  {shipments.filter(s => s.status === "Perlu dispatch" || s.status === "Menunggu pickup").map(s => <div className="dispatch-row" key={s.code}>
                    <div className="dispatch-badge">↗</div><div className="dispatch-copy"><strong>{s.code} · {s.tenant}</strong><span>{s.origin} → {s.destination}</span></div><span className={statusClass(s.status)}>{s.status}</span><button className="text-button" onClick={() => setSelected(s)}>Lihat detail →</button>
                  </div>)}
                </div>
              </section>
              <footer>© NUSA-DHIPA · WEB COMMANDER <span>SHIPPING OPERATIONS / DEMO ENVIRONMENT</span></footer>
            </>
          )}
        </div>
      </section>

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}>
        <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e => e.stopPropagation()}>
          <div className="modal-head"><div><div className="eyebrow">SHIPMENT DETAIL / DEMO</div><h2 id="detail-title">{selected.code}</h2></div><button className="close-button" onClick={() => setSelected(null)}>×</button></div>
          <div className="demo-warning"><span>!</span><div><strong>Data simulasi</strong><p>Detail ini bukan tracking live dari kurir.</p></div></div>
          <div className="detail-grid">
            <div><small>ORDER</small><strong>{selected.order}</strong></div><div><small>STATUS</small><strong>{selected.status}</strong></div>
            <div><small>TENANT</small><strong>{selected.tenant}</strong></div><div><small>PELANGGAN</small><strong>{selected.customer}</strong></div>
            <div><small>KURIR</small><strong>{selected.courier}</strong></div><div><small>LAYANAN</small><strong>{selected.service}</strong></div>
            <div><small>ASAL</small><strong>{selected.origin}</strong></div><div><small>TUJUAN</small><strong>{selected.destination}</strong></div>
            <div><small>NOMOR RESI</small><strong>{selected.tracking}</strong></div><div><small>BIAYA</small><strong>{money(selected.amount)}</strong></div>
            <div><small>UPDATE TERAKHIR</small><strong>{selected.updated}</strong></div><div><small>ESTIMASI</small><strong>{selected.eta}</strong></div>
          </div>
          <div className="timeline"><strong>Tracking timeline</strong><div className="timeline-item"><span className="timeline-dot" /><div><b>Shipment tercatat di data demo</b><p>Status operasional aktual belum tersedia.</p></div></div><div className="timeline-item"><span className="timeline-dot muted" /><div><b>Update kurir</b><p>Menunggu integrasi API dan event tracking.</p></div></div></div>
          <button className="primary-button full-button" onClick={() => setSelected(null)}>Tutup detail</button>
        </section>
      </div>}
    </main>
  );
}