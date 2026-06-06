"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/finanzas", label: "Finanzas" },
  { href: "/admin/copropiedad", label: "Copropiedad" },
  { href: "/admin/solicitudes", label: "PQRS" },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {links.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-secondary text-white"
                : "bg-surface border border-border text-text-secondary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
