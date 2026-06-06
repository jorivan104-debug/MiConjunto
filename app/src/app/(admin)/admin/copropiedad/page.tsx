import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  adminConjunto,
  unidadesMaestro,
} from "@/lib/admin-mock-data";

export default function AdminCopropiedadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">Copropiedad</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Maestro de unidades · {adminConjunto.unidadesTotales} registros (muestra
          parcial mock)
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Torres</p>
          <p className="text-2xl font-bold text-secondary mt-1">
            {adminConjunto.torres}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Unidades</p>
          <p className="text-2xl font-bold text-text mt-1">
            {adminConjunto.unidadesTotales}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-text-secondary font-medium">Dirección</p>
          <p className="text-sm font-medium text-text mt-1 leading-snug">
            {adminConjunto.direccion}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-text mb-3">Unidades (demo)</h2>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="pb-2 pr-2 font-medium">Código</th>
                <th className="pb-2 pr-2 font-medium">Tipo</th>
                <th className="pb-2 pr-2 font-medium text-right">Coef.</th>
                <th className="pb-2 pr-2 font-medium">Propietario</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {unidadesMaestro.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-2 font-semibold text-text">{u.codigo}</td>
                  <td className="py-2.5 pr-2 text-text-secondary">{u.tipo}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-text">
                    {u.coeficiente}%
                  </td>
                  <td className="py-2.5 pr-2 text-text-secondary truncate max-w-[160px]">
                    {u.propietario}
                  </td>
                  <td className="py-2.5">
                    <Badge
                      variant={
                        u.estado === "Al día"
                          ? "success"
                          : u.estado === "Mora"
                          ? "danger"
                          : "info"
                      }
                    >
                      {u.estado}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
