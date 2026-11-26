/**
 * Prueba de integración del ciclo de cobro contra una base PostgreSQL real.
 * Requiere DATABASE_URL. Ejecutar con: npm run test:e2e
 */
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { CobrosService } from '../src/cobros/cobros.service';
import { ContabilidadService } from '../src/contabilidad/contabilidad.service';
import { CopropiedadesService } from '../src/copropiedades/copropiedades';
import { PagosService } from '../src/pagos/pagos';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsuariosService } from '../src/usuarios/usuarios';
import { AuthService } from '../src/auth/auth';

describe('ciclo de cobro', () => {
  let app: INestApplicationContext;
  let prisma: PrismaService;
  let cobros: CobrosService;
  let pagos: PagosService;
  let conta: ContabilidadService;
  let copId: string;
  let adminId: string;
  const unidades: string[] = [];

  const cuadra = async () => {
    const b = await conta.balancePrueba(copId);
    expect(b.totalDebitos).toBe(b.totalCreditos);
    const cxc = b.filas.find((f) => f.codigo === '1305')!.saldo;
    const pend = await prisma.cargo.aggregate({ where: { copropiedadId: copId, estado: 'PENDIENTE' }, _sum: { saldo: true } });
    expect(cxc).toBe(Number(pend._sum.saldo ?? 0));
    const anticipos = b.filas.find((f) => f.codigo === '2805')!.saldo;
    const favor = await prisma.pago.aggregate({ where: { copropiedadId: copId, estado: 'CONFIRMADO' }, _sum: { saldoAFavor: true } });
    expect(anticipos).toBe(Number(favor._sum.saldoAFavor ?? 0));
  };

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    prisma = app.get(PrismaService);
    cobros = app.get(CobrosService);
    pagos = app.get(PagosService);
    conta = app.get(ContabilidadService);
    const sufijo = Date.now().toString();
    const admin = await prisma.usuario.create({ data: { email: `e2e-${sufijo}@prueba.co`, nombre: 'E2E', passwordHash: 'x' } });
    adminId = admin.id;
    const cop = await app.get(CopropiedadesService).crear(adminId, { nit: `E2E-${sufijo}`, nombre: 'Prueba E2E' });
    copId = cop.id;
    for (const [n, coef] of [['101', 0.5], ['102', 0.3], ['103', 0.2]] as const) {
      unidades.push((await prisma.unidad.create({ data: { copropiedadId: copId, numero: n, coeficiente: coef } })).id);
    }
    await cobros.guardarPresupuesto(copId, adminId, { anio: 2030, totalAnual: 12_000_000, fondoImprevistosPct: 1 });
    await cobros.guardarTasa('2030-02', 0.2);
  }, 30_000);

  afterAll(async () => {
    await prisma.copropiedad.delete({ where: { id: copId } });
    await prisma.usuario.delete({ where: { id: adminId } });
    await prisma.tasaInteres.delete({ where: { periodo: '2030-02' } });
    await app.close();
  });

  it('liquida por coeficiente sin duplicar', async () => {
    const r = await cobros.liquidar(copId, '2030-01', adminId);
    expect(r.totalOrdinaria).toBe(1_000_000);
    expect(r.totalFondo).toBe(10_000);
    const ec = await cobros.estadoCuenta(copId, unidades[0]);
    expect(ec.saldo).toBe(505_000);
    const otra = await cobros.liquidar(copId, '2030-01', adminId);
    expect(otra.unidadesLiquidadas).toBe(0);
    await cuadra();
  });

  it('genera intereses sobre capital vencido y los cobra primero', async () => {
    const r = await cobros.generarIntereses(copId, '2030-02', adminId);
    expect(r.unidades).toBe(3);
    const tasa = Math.pow(1.3, 1 / 12) - 1;
    const ec = await cobros.estadoCuenta(copId, unidades[0]);
    const interes = ec.cargos.find((c) => c.tipo === 'INTERES_MORA')!;
    expect(interes.valor).toBe(Math.round(505_000 * tasa));
    await pagos.registrar(copId, adminId, { unidadId: unidades[0], valor: interes.valor + 100_000, medio: 'TRANSFERENCIA' });
    const despues = await cobros.estadoCuenta(copId, unidades[0]);
    expect(despues.cargos.find((c) => c.tipo === 'INTERES_MORA')!.saldo).toBe(0);
    expect(despues.saldo).toBe(405_000);
    await cuadra();
  });

  it('guarda el excedente como anticipo y lo aplica al siguiente mes', async () => {
    const p = await pagos.registrar(copId, adminId, { unidadId: unidades[2], valor: 500_000, medio: 'EFECTIVO' });
    const ec = await cobros.estadoCuenta(copId, unidades[2]);
    expect(ec.saldo).toBe(0);
    expect(ec.saldoAFavor).toBeGreaterThan(0);
    await cuadra();
    await cobros.liquidar(copId, '2030-03', adminId);
    const ec2 = await cobros.estadoCuenta(copId, unidades[2]);
    expect(ec2.saldo).toBe(0);
    await cuadra();
    // Anular el pago devuelve la deuda y revierte la contabilidad
    await pagos.anular(copId, p.id, adminId, 'prueba');
    const ec3 = await cobros.estadoCuenta(copId, unidades[2]);
    expect(ec3.saldo).toBeGreaterThan(0);
    expect(ec3.saldoAFavor).toBe(0);
    await cuadra();
  });

  it('traspasa la administración sin mover los datos del conjunto', async () => {
    const correo = `e2e-nuevo-${Date.now()}@prueba.co`;
    const r = await app.get(UsuariosService).traspasar(copId, adminId, { email: correo, nombre: 'Nueva Administradora' });
    expect(r.passwordTemporal).toBeTruthy();
    expect(r.anteriores).toHaveLength(1);
    const admins = await prisma.membresia.findMany({ where: { copropiedadId: copId, rol: 'ADMINISTRADOR' } });
    expect(admins.map((a) => a.usuarioId)).toEqual([r.usuarioId]);
    expect(await prisma.unidad.count({ where: { copropiedadId: copId } })).toBe(3);
    const perfil = await app.get(AuthService).perfil(r.usuarioId);
    expect(perfil.copropiedades).toEqual([expect.objectContaining({ id: copId, administracion: 'Nueva Administradora', roles: ['ADMINISTRADOR'] })]);
    // Devuelve el conjunto para que la limpieza siga funcionando
    await app.get(UsuariosService).traspasar(copId, r.usuarioId, { email: (await prisma.usuario.findUniqueOrThrow({ where: { id: adminId } })).email, nombre: 'E2E' });
    await prisma.usuario.delete({ where: { id: r.usuarioId } });
  });
});
