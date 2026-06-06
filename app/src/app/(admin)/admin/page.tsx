import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Inbox,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  adminConjunto,
  adminKpis,
  unidadesConMora,
  pqrsBandeja,
  formatCurrencyAdmin,
  pct,
} from "@/lib/admin-mock-data";

export default function AdminDashboardPage() {
  const recaudoPct = pct(adminKpis.recaudoMes, adminKpis.metaRecaudoMes);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">Resumen</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {adminConjunto.nombre} · {adminConjunto.unidadesTotales} unidades ·{" "}
          {adminConjunto.torres} torres
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md" className="!border-secondary/20">
          <p className="text-xs font-medium text-text-secondary">
            Recaudo del mes
          </p>
          <p className="text-lg font-bold text-secondary mt-1 tabular-nums">
            {formatCurrencyAdmin(adminKpis.recaudoMes)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-[11px] text-text-muted">
              Meta {recaudoPct} ({formatCurrencyAdmin(adminKpis.metaRecaudoMes)})
            </span>
          </div>
        </Card>
        <Card padding="md" className="!border-danger/20">
          <p className="text-xs font-medium text-text-secondary">Cartera en mora</p>
          <p className="text-lg font-bold text-danger mt-1 tabular-nums">
            {formatCurrencyAdmin(adminKpis.carteraMora)}
          </p>
          <p className="text-[11px] text-text-muted mt-2">
            {adminKpis.unidadesEnMora} unidades
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-text-secondary">PQRS abiertos</p>
          <p className="text-lg font-bold text-text mt-1 tabular-nums">
            {adminKpis.pqrsAbiertos}
          </p>
          <Link
            href="/admin/solicitudes"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary mt-2 hover:underline"
          >
            Ver bandeja <ArrowRight size={12} />
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-text-secondary">
            Mantenimiento abierto
          </p>
          <p className="text-lg font-bold text-accent mt-1 tabular-nums">
            {adminKpis.mantenimientoAbierto}
          </p>
          <p className="text-[11px] text-text-muted mt-2">
            Órdenes de trabajo activas
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" />
              Unidades con mayor mora
            </h2>
            <Link
              href="/admin/finanzas"
              className="text-xs font-medium text-secondary hover:underline"
            >
              Finanzas
            </Link>
          </div>
          <ul className="space-y-2">
            {unidadesConMora.slice(0, 4).map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text truncate">{u.codigo}</p>
                  <p className="text-xs text-text-muted truncate">{u.propietario}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-danger tabular-nums">
                    {formatCurrencyAdmin(u.saldo)}
                  </p>
                  <Badge variant="danger" dot>
                    {u.diasMora} días
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Inbox size={16} className="text-secondary" />
              PQRS recientes
            </h2>
            <Link
              href="/admin/solicitudes"
              className="text-xs font-medium text-secondary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <ul className="space-y-2">
            {pqrsBandeja.map((p) => (
              <li
                key={p.id}
                className="text-sm border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-text line-clamp-1">{p.asunto}</p>
                  <Badge
                    variant={
                      p.estado === "Resuelto"
                        ? "success"
                        : p.estado === "En curso"
                        ? "info"
                        : "warning"
                    }
                  >
                    {p.estado}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {p.radicado} · {p.unidad}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary-50 text-secondary flex items-center justify-center">
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Visitantes hoy</p>
            <p className="text-xs text-text-secondary">
              Registro en portería (demo)
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-secondary tabular-nums">
          {adminKpis.visitantesHoy}
        </p>
      </Card>

      <p className="text-[11px] text-text-muted text-center sm:text-left">
        Datos de demostración. No reflejan información real de copropiedades.
      </p>
    </div>
  );
}
