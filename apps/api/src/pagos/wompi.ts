import { createHash, timingSafeEqual } from 'crypto';

/**
 * Integración con Wompi (pasarela colombiana: PSE, tarjetas, Nequi, Bancolombia).
 * El dinero llega directo a la cuenta de la copropiedad; la plataforma no custodia fondos.
 * Debe probarse en el ambiente sandbox de Wompi antes de usarse en producción.
 */
export const wompiConfigurado = () => !!process.env.WOMPI_PUBLIC_KEY && !!process.env.WOMPI_INTEGRITY_SECRET;

/** Firma de integridad: SHA256(referencia + monto en centavos + moneda + secreto de integridad). */
export function firmaIntegridad(referencia: string, montoCentavos: number, moneda: string, secreto: string) {
  return createHash('sha256').update(`${referencia}${montoCentavos}${moneda}${secreto}`).digest('hex');
}

export function urlCheckout(referencia: string, valorPesos: number) {
  const centavos = Math.round(valorPesos * 100);
  const params = new URLSearchParams({
    'public-key': process.env.WOMPI_PUBLIC_KEY ?? '',
    currency: 'COP',
    'amount-in-cents': String(centavos),
    reference: referencia,
    'signature:integrity': firmaIntegridad(referencia, centavos, 'COP', process.env.WOMPI_INTEGRITY_SECRET ?? ''),
  });
  if (process.env.WOMPI_REDIRECT_URL) params.set('redirect-url', process.env.WOMPI_REDIRECT_URL);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

const obtener = (obj: any, ruta: string) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/**
 * Verifica la firma de un evento: SHA256 de los valores de signature.properties (tomados de data),
 * seguidos del timestamp y del secreto de eventos.
 */
export function eventoValido(evento: any, secreto: string): boolean {
  const props: string[] | undefined = evento?.signature?.properties;
  const checksum: string | undefined = evento?.signature?.checksum;
  if (!props || !checksum || !secreto) return false;
  const cadena = props.map((p) => String(obtener(evento.data, p))).join('') + String(evento.timestamp) + secreto;
  const calculado = createHash('sha256').update(cadena).digest('hex');
  const a = Buffer.from(calculado.toLowerCase());
  const b = Buffer.from(checksum.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
