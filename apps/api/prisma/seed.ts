/**
 * Datos de demostración. Crea un superadministrador y un conjunto de ejemplo
 * usando los mismos servicios de la aplicación (liquidación, pagos, reservas).
 *
 *   Superadmin:  admin@miconjunto.app / Admin12345!
 *   Residente:   residente@demo.co    / Demo12345!
 *   Contador:    contador@demo.co     / Demo12345!
 */
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { VERSION_POLITICA_DATOS } from '../src/auth/auth';
import { CobrosService } from '../src/cobros/cobros.service';
import { ComunicadosService } from '../src/comunicados/comunicados';
import { CopropiedadesService } from '../src/copropiedades/copropiedades';
import { PagosService } from '../src/pagos/pagos';
import { PqrsService } from '../src/pqrs/pqrs';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const prisma = app.get(PrismaService);

  if (await prisma.copropiedad.findUnique({ where: { nit: '900123456-7' } })) {
    console.log('Los datos de demostración ya existen.');
    await app.close();
    return;
  }

  const hash = (p: string) => bcrypt.hash(p, 10);
  // Cuentas de demostración con la autorización de datos ya aceptada
  const autorizado = { autorizacionDatosAt: new Date(), autorizacionVersion: VERSION_POLITICA_DATOS };
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@miconjunto.app' },
    create: { email: 'admin@miconjunto.app', nombre: 'Administración Demo', passwordHash: await hash('Admin12345!'), esSuperAdmin: true, ...autorizado },
    update: {},
  });

  const cop = await app.get(CopropiedadesService).crear(admin.id, {
    nit: '900123456-7',
    nombre: 'Conjunto Residencial Los Cerezos',
    tipo: 'RESIDENCIAL',
    direccion: 'Calle 147 # 12-30',
    ciudad: 'Bogotá',
    responsableIva: true,
  });

  // 2 torres x 8 apartamentos; coeficiente proporcional al área privada (art. 26 Ley 675)
  const areas = [62, 62, 75, 75, 62, 62, 90, 90];
  const unidades: { torre: string; numero: string; area: number }[] = [];
  for (const torre of ['Torre 1', 'Torre 2']) {
    areas.forEach((area, i) => unidades.push({ torre, numero: `${Math.floor(i / 2) + 1}0${(i % 2) + 1}`, area }));
  }
  const areaTotal = unidades.reduce((s, u) => s + u.area, 0);
  const creadas = [];
  for (const u of unidades) {
    const torre = await prisma.torre.upsert({
      where: { copropiedadId_nombre: { copropiedadId: cop.id, nombre: u.torre } },
      create: { copropiedadId: cop.id, nombre: u.torre },
      update: {},
    });
    creadas.push(await prisma.unidad.create({
      data: { copropiedadId: cop.id, torreId: torre.id, numero: u.numero, areaPrivada: u.area, coeficiente: u.area / areaTotal },
    }));
  }

  const persona = async (email: string, nombre: string, rol: any) => {
    const usuario = await prisma.usuario.upsert({
      where: { email },
      create: { email, nombre, passwordHash: await hash('Demo12345!'), ...autorizado },
      update: {},
    });
    await prisma.membresia.create({ data: { usuarioId: usuario.id, copropiedadId: cop.id, rol } });
    return usuario;
  };
  const residente = await persona('residente@demo.co', 'Laura Gómez', 'PROPIETARIO');
  await prisma.unidadPersona.create({ data: { unidadId: creadas[0].id, usuarioId: residente.id, vinculo: 'PROPIETARIO', responsablePago: true } });
  const vecino = await persona('vecino@demo.co', 'Carlos Rojas', 'PROPIETARIO');
  await prisma.unidadPersona.create({ data: { unidadId: creadas[1].id, usuarioId: vecino.id, vinculo: 'PROPIETARIO', responsablePago: true } });
  await persona('contador@demo.co', 'Martha Díaz (Contadora)', 'CONTADOR');
  await persona('consejo@demo.co', 'Jorge Pérez (Consejo)', 'CONSEJO');
  await persona('porteria@demo.co', 'Portería Los Cerezos', 'PORTERIA');

  const cobros = app.get(CobrosService);
  await cobros.guardarPresupuesto(cop.id, admin.id, { anio: 2026, totalAnual: 180_000_000, fondoImprevistosPct: 1, actaAprobacion: 'Acta 012 de marzo de 2026' });

  // Tasa de EJEMPLO. Reemplazar por la certificada por la Superintendencia Financiera cada mes.
  for (const periodo of ['2026-09', '2026-10', '2026-11', '2026-12']) await cobros.guardarTasa(periodo, 0.17);

  await cobros.liquidar(cop.id, '2026-10', admin.id);
  await cobros.liquidar(cop.id, '2026-11', admin.id);
  await cobros.generarIntereses(cop.id, '2026-11', admin.id);

  const pagos = app.get(PagosService);
  // La mayoría de unidades pagó; dos quedan en mora para mostrar la cartera.
  for (const u of creadas.slice(2)) {
    const ec = await cobros.estadoCuenta(cop.id, u.id);
    if (ec.saldo > 0) await pagos.registrar(cop.id, admin.id, { unidadId: u.id, valor: ec.saldo, medio: 'TRANSFERENCIA', referencia: `TRF-${u.numero}-${u.torreId?.slice(-4)}` });
  }

  await prisma.zonaComun.createMany({
    data: [
      { copropiedadId: cop.id, nombre: 'Salón social', descripcion: 'Capacidad 60 personas, con cocina', capacidad: 60, tarifa: 80_000, maxHoras: 6, horaApertura: '09:00', horaCierre: '23:00' },
      { copropiedadId: cop.id, nombre: 'Zona BBQ', descripcion: 'Asador y 4 mesas', capacidad: 20, tarifa: 0, requiereAprobacion: false },
      { copropiedadId: cop.id, nombre: 'Cancha múltiple', capacidad: 12, tarifa: 0, maxHoras: 2, requiereAprobacion: false, horaApertura: '06:00', horaCierre: '21:00' },
    ],
  });

  const com = app.get(ComunicadosService);
  await com.crear(cop.id, admin.id, { titulo: 'Mantenimiento de ascensores', cuerpo: 'El martes de 8:00 a. m. a 12:00 m. se hará mantenimiento preventivo a los ascensores de la Torre 1. Gracias por su comprensión.' });
  await com.crear(cop.id, admin.id, { titulo: 'Convocatoria asamblea ordinaria 2027', cuerpo: 'Se convoca a la asamblea general ordinaria para el 15 de marzo de 2027. La convocatoria formal se enviará con 15 días calendario de anticipación (art. 39 Ley 675).' });

  const pqrs = app.get(PqrsService);
  await pqrs.crear(cop.id, { id: residente.id, email: residente.email, esSuperAdmin: false, roles: ['PROPIETARIO'] }, {
    tipo: 'DANO', asunto: 'Luz dañada en el pasillo del piso 1', descripcion: 'La lámpara del pasillo frente al 101 no enciende desde hace tres días.', unidadId: creadas[0].id,
  });

  console.log('Datos de demostración creados.');
  console.log('  Administrador: admin@miconjunto.app / Admin12345!');
  console.log('  Residente:     residente@demo.co / Demo12345!');
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
