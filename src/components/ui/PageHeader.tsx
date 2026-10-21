import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-brand-600 rounded-full shrink-0" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-brand-600" />}
            {title}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">{description}</p>
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
