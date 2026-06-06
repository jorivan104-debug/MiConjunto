"""Catálogo PUC base para entidades de propiedad horizontal en Colombia.

Estructura simplificada y adaptada a copropiedades sin ánimo de lucro. No
sustituye asesoría contable: la administración puede personalizar el plan
según necesidades específicas.
"""
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.models.accounting_puc import AccountType, ChartOfAccount


# (code, name, type, level, accepts_movement)
PUC_BASE: List[Tuple[str, str, AccountType, int, bool]] = [
    # Clase 1 - Activos
    ("1", "ACTIVO", AccountType.ACTIVO, 1, False),
    ("11", "Disponible", AccountType.ACTIVO, 2, False),
    ("1105", "Caja", AccountType.ACTIVO, 3, True),
    ("1110", "Bancos", AccountType.ACTIVO, 3, True),
    ("13", "Deudores", AccountType.ACTIVO, 2, False),
    ("1305", "Cartera copropietarios", AccountType.ACTIVO, 3, True),
    ("1310", "Anticipos a proveedores", AccountType.ACTIVO, 3, True),
    ("14", "Inventarios", AccountType.ACTIVO, 2, False),
    ("1435", "Insumos y materiales", AccountType.ACTIVO, 3, True),
    ("15", "Propiedad, planta y equipo", AccountType.ACTIVO, 2, False),
    ("1524", "Equipo de oficina", AccountType.ACTIVO, 3, True),
    ("1528", "Equipo de cómputo y comunicación", AccountType.ACTIVO, 3, True),
    # Clase 2 - Pasivos
    ("2", "PASIVO", AccountType.PASIVO, 1, False),
    ("22", "Proveedores", AccountType.PASIVO, 2, False),
    ("2205", "Proveedores nacionales", AccountType.PASIVO, 3, True),
    ("23", "Cuentas por pagar", AccountType.PASIVO, 2, False),
    ("2335", "Costos y gastos por pagar", AccountType.PASIVO, 3, True),
    ("24", "Impuestos, gravámenes y tasas", AccountType.PASIVO, 2, False),
    ("2408", "IVA", AccountType.PASIVO, 3, True),
    ("2365", "Retención en la fuente", AccountType.PASIVO, 3, True),
    ("28", "Otros pasivos", AccountType.PASIVO, 2, False),
    ("2805", "Anticipos copropietarios", AccountType.PASIVO, 3, True),
    # Clase 3 - Patrimonio (entidad sin ánimo de lucro)
    ("3", "PATRIMONIO", AccountType.PATRIMONIO, 1, False),
    ("31", "Fondo social", AccountType.PATRIMONIO, 2, False),
    ("3105", "Fondo social", AccountType.PATRIMONIO, 3, True),
    ("32", "Fondo de imprevistos", AccountType.PATRIMONIO, 2, False),
    ("3205", "Fondo de imprevistos (Ley 675)", AccountType.PATRIMONIO, 3, True),
    ("36", "Resultado del ejercicio", AccountType.PATRIMONIO, 2, False),
    ("3605", "Excedentes / déficits del ejercicio", AccountType.PATRIMONIO, 3, True),
    # Clase 4 - Ingresos
    ("4", "INGRESOS", AccountType.INGRESO, 1, False),
    ("41", "Operacionales", AccountType.INGRESO, 2, False),
    ("4105", "Cuotas de administración", AccountType.INGRESO, 3, True),
    ("4110", "Cuotas extraordinarias", AccountType.INGRESO, 3, True),
    ("4115", "Multas y sanciones", AccountType.INGRESO, 3, True),
    ("4120", "Intereses por mora", AccountType.INGRESO, 3, True),
    ("4125", "Alquiler zonas comunes", AccountType.INGRESO, 3, True),
    ("4130", "Otros ingresos", AccountType.INGRESO, 3, True),
    ("42", "No operacionales", AccountType.INGRESO, 2, False),
    ("4210", "Rendimientos financieros", AccountType.INGRESO, 3, True),
    # Clase 5 - Gastos
    ("5", "GASTOS", AccountType.GASTO, 1, False),
    ("51", "Operacionales", AccountType.GASTO, 2, False),
    ("5105", "Personal y honorarios administrativos", AccountType.GASTO, 3, True),
    ("5110", "Mantenimiento y reparaciones", AccountType.GASTO, 3, True),
    ("5115", "Servicios públicos zonas comunes", AccountType.GASTO, 3, True),
    ("5120", "Aseo y vigilancia", AccountType.GASTO, 3, True),
    ("5125", "Honorarios", AccountType.GASTO, 3, True),
    ("5130", "Seguros y pólizas", AccountType.GASTO, 3, True),
    ("5135", "Útiles, papelería y aseo", AccountType.GASTO, 3, True),
    ("5140", "Asesorías legales y contables", AccountType.GASTO, 3, True),
    ("5145", "Bancarios", AccountType.GASTO, 3, True),
    ("5195", "Diversos", AccountType.GASTO, 3, True),
    ("52", "No operacionales", AccountType.GASTO, 2, False),
    ("5295", "Otros gastos no operacionales", AccountType.GASTO, 3, True),
]


def seed_puc_for_condominium(db: Session, condominium_id: int) -> List[ChartOfAccount]:
    """Inserta las cuentas PUC base para un condominio si no existen."""
    existing = {
        a.code: a
        for a in db.query(ChartOfAccount)
        .filter(ChartOfAccount.condominium_id == condominium_id)
        .all()
    }
    code_to_id = {code: a.id for code, a in existing.items()}
    for code, name, type_, level, accepts in PUC_BASE:
        if code in existing:
            continue
        parent_id = None
        if level > 1:
            for plen in range(len(code) - 1, 0, -1):
                parent_code = code[:plen]
                if parent_code in code_to_id:
                    parent_id = code_to_id[parent_code]
                    break
        acc = ChartOfAccount(
            condominium_id=condominium_id,
            code=code,
            name=name,
            type=type_,
            parent_id=parent_id,
            level=level,
            accepts_movement=accepts,
            is_active=True,
        )
        db.add(acc)
        db.flush()
        code_to_id[code] = acc.id
    db.commit()
    return (
        db.query(ChartOfAccount)
        .filter(ChartOfAccount.condominium_id == condominium_id)
        .order_by(ChartOfAccount.code)
        .all()
    )
