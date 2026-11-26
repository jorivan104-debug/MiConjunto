# Bases del producto

El documento completo de investigación y bases está en Claude: **Bases del software de gestión de propiedad horizontal** (mercado, vacíos, roles, entidades, marco legal y stack). Este archivo resume lo que guía el código.

## Propuesta

Una plataforma colombiana que une cobro, comunicación y cumplimiento legal a un precio público y accesible, también para conjuntos pequeños. Solo cerca del 5 % de las copropiedades del país usa software especializado.

## Fases

| Fase | Módulos | Estado |
| --- | --- | --- |
| MVP | Unidades y coeficientes, roles, cobro y cartera con intereses legales, pagos (manual y en línea), asientos contables automáticos, comunicados, PQRS, reservas, documentos | **Implementado en este repositorio** |
| Fase 2 | Contabilidad completa (comprobantes manuales, estados financieros, ejecución presupuestal, retenciones, IVA, exógena, cierre de periodo), conciliación bancaria, factura electrónica DIAN, portería, mantenimiento y proveedores, envío por WhatsApp y correo | Pendiente |
| Fase 3 | Asambleas virtuales y mixtas con quórum por coeficiente, convivencia y sanciones, asistente de IA | Pendiente |

## Reglas legales implementadas

| Norma | Regla | Dónde |
| --- | --- | --- |
| Ley 675, arts. 3, 25-29 | Las expensas se reparten por coeficiente | `apps/api/src/cobros/calculos.ts` (`distribuirPorCoeficiente`) |
| Ley 675, art. 30 | Mora máxima de 1,5 veces el interés bancario corriente; la asamblea puede fijar una menor | `tasaMoraAplicable` |
| Ley 675, art. 35 | Fondo de imprevistos de al menos 1 % del presupuesto | `cuotaMensualTotal` |
| Ley 675, art. 48 | Certificado de deuda del administrador como título ejecutivo | `GET /cobros/certificado/:unidadId` y página `/certificado` |
| Código Civil, art. 1653 | Los pagos se imputan primero a intereses | `imputarPago` |
| DIAN, Comunicado 019 de 2025 | El alquiler de zonas comunes está gravado con IVA si se cobra | Concepto "Uso de zonas comunes" según `responsableIva` |
| Ley 1581 de 2012 | Autorización de datos con fecha y versión; auditoría | `POST /auth/autorizar-datos`, tabla `Auditoria` |

Estas reglas se validaron para diseñar el producto; antes del lanzamiento debe revisarlas un abogado y un contador de propiedad horizontal.
