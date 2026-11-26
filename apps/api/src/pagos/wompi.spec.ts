import { createHash } from 'crypto';
import { eventoValido, firmaIntegridad } from './wompi';

describe('Wompi', () => {
  it('firma de integridad', () => {
    const esperado = createHash('sha256').update('REF1' + '2500000' + 'COP' + 'secreto').digest('hex');
    expect(firmaIntegridad('REF1', 2500000, 'COP', 'secreto')).toBe(esperado);
  });

  it('valida y rechaza eventos según su checksum', () => {
    const data = { transaction: { id: 'T1', status: 'APPROVED', amount_in_cents: 2500000 } };
    const timestamp = 1700000000;
    const checksum = createHash('sha256').update('T1APPROVED2500000' + timestamp + 'eventos').digest('hex');
    const evento = { data, timestamp, signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], checksum } };
    expect(eventoValido(evento, 'eventos')).toBe(true);
    expect(eventoValido({ ...evento, data: { transaction: { ...data.transaction, status: 'DECLINED' } } }, 'eventos')).toBe(false);
  });
});
