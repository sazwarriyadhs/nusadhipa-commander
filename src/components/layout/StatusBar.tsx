export function StatusBar() {
  return (
    <footer className="h-8 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between px-4 text-[11px] text-neutral-500 font-medium shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Audit Trail Active</span>
        <span className="hidden sm:inline">Last Sync: 2 min ago</span>
        <span className="hidden sm:inline">Env: Production</span>
      </div>
      <div className="flex items-center gap-4">
        <span>v1.0.0</span>
        <span className="flex items-center gap-1.5 text-green-600"><ActivityIcon /> Service Healthy</span>
      </div>
    </footer>
  );
}

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
