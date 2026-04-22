import Link from "next/link";
import { Bell, TreePine } from "lucide-react";
import { adminConjunto, adminUsuario } from "@/lib/admin-mock-data";

export function AdminTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 shrink-0"
        >
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-[--radius-md] bg-secondary flex items-center justify-center">
            <TreePine size={20} className="text-white" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-bold text-secondary truncate leading-tight">
              Mi Conjunto
            </p>
            <p className="text-[10px] md:text-xs text-text-muted truncate hidden sm:block">
              {adminConjunto.nombre}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          type="button"
          className="relative rounded-full p-2 text-text-secondary hover:bg-surface-alt transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>
        <div className="hidden sm:flex flex-col items-end text-right leading-tight pl-2 border-l border-border">
          <span className="text-xs font-semibold text-text truncate max-w-[140px]">
            {adminUsuario.nombre}
          </span>
          <span className="text-[10px] text-text-muted">{adminUsuario.rol}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary-50 text-primary text-xs font-bold flex items-center justify-center">
          AR
        </div>
      </div>
    </header>
  );
}
