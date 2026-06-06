import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  adminKpis,
  ejecucionPresupuesto,
  movimientosRecientes,
  unidadesConMora,
  formatCurrencyAdmin,
  pct,
} from "@/lib/admin-mock-data";

export default function AdminFinanzasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">Finanzas</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Cartera, tesorería y ejecución presupuestal (mock)
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Recaudo mes</p>
          <p className="text-lg font-bold text-secondary mt-1 tabular-nums">
            {formatCurrencyAdmin(adminKpis.recaudoMes)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Mora total</p>
          <p className="text-lg font-bold text-danger mt-1 tabular-nums">
            {formatCurrencyAdmin(adminKpis.carteraMora)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Unidades en mora</p>
          <p className="text-lg font-bold text-text mt-1 tabular-nums">
            {adminKpis.unidadesEnMora}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-text mb-3">
          Ejecución presupuestal (YTD)
        </h2>
        <div className="space-y-3">
          {ejecucionPresupuesto.map((r) => {
            const p = pct(r.ejecutado, r.presupuestado);
            return (
              <div key={r.rubro}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-text">{r.rubro}</span>
                  <span className="text-text-muted tabular-nums">
                    {formatCurrencyAdmin(r.ejecutado)} /{" "}
                    {formatCurrencyAdmin(r.presupuestado)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, Math.round((r.ejecutado / r.presupuestado) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-0.5">{p} ejecutado</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card padding="md">
          <h2 className="text-sm font-semibold text-text mb-3">Cartera por unidad</h2>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-border">
                  <th className="pb-2 pr-2 font-medium">Unidad</th>
                  <th className="pb-2 pr-2 font-medium">Propietario</th>
                  <th className="pb-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {unidadesConMora.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2 font-medium text-text">{u.codigo}</td>
                    <td className="py-2 pr-2 text-text-secondary truncate max-w-[140px]">
                      {u.propietario}
                    </td>
                    <td className="py-2 text-right font-semibold text-danger tabular-nums">
                      {formatCurrencyAdmin(u.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padding="md">
          <h2 className="text-sm font-semibold text-text mb-3">
            Movimientos recientes
          </h2>
          <ul className="space-y-2">
            {movimientosRecientes.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-2 text-sm border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-text leading-snug">{m.concepto}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{m.fecha}</p>
                </div>
                <Badge variant={m.tipo === "ingreso" ? "success" : "neutral"}>
                  {m.tipo === "ingreso" ? "+" : "−"}{" "}
                  {formatCurrencyAdmin(m.monto)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
