import { Construction } from "lucide-react";

export function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white border border-neutral-200 border-dashed rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-4">
        <Construction className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">{title}</h2>
      <p className="text-neutral-500 max-w-md mx-auto">{description}</p>
      <div className="mt-8 px-4 py-2 bg-neutral-100 text-neutral-500 text-sm font-medium rounded-lg">
        🚧 Modul ini sedang dalam tahap pengembangan
      </div>
    </div>
  );
}
