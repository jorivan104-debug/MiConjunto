"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Inbox,
  TreePine,
  ExternalLink,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/admin/copropiedad", label: "Copropiedad", icon: Building2 },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden md:flex w-56 flex-col border-r border-border bg-surface">
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-secondary min-w-0">
          <TreePine size={22} strokeWidth={1.8} className="shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide truncate">
            Administración
          </span>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        {links.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-[--radius-md] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-secondary-50 text-secondary"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-[--radius-md] px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt hover:text-secondary transition-colors"
        >
          <ExternalLink size={18} strokeWidth={1.8} />
          Portal residente
        </Link>
      </div>
    </aside>
  );
}
