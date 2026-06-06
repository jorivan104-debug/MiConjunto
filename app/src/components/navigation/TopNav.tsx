"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  Users,
  FileText,
  User,
  Bell,
  TreePine,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/pagos", label: "Pagos", icon: Wallet },
  { href: "/comunidad", label: "Comunidad", icon: Users },
  { href: "/solicitudes", label: "Solicitudes", icon: FileText },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border h-16 items-center px-6">
      <Link href="/dashboard" className="flex items-center gap-2.5 mr-10">
        <div className="h-9 w-9 rounded-[--radius-md] bg-primary flex items-center justify-center">
          <TreePine size={20} className="text-white" />
        </div>
        <span className="text-lg font-bold text-secondary">Mi Conjunto</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[--radius-md] text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/admin"
        className="ml-4 shrink-0 text-xs font-semibold text-secondary hover:underline px-2 py-1 rounded-[--radius-sm] hover:bg-secondary-50"
      >
        Panel admin
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary">
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-secondary-50 text-secondary font-semibold text-xs flex items-center justify-center">
            CM
          </div>
          <div className="text-sm leading-tight">
            <p className="font-medium text-text">Carlos Mendoza</p>
            <p className="text-xs text-text-muted">Apto 402 · Torre A</p>
          </div>
        </div>
      </div>
    </header>
  );
}
