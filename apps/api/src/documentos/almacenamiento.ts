import { BadRequestException } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { randomBytes } from 'crypto';

const PERMITIDOS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];

/**
 * Almacenamiento de archivos en disco local. Para producción se puede cambiar por S3
 * implementando las mismas dos funciones.
 */
export const almacenamiento = {
  raiz: () => resolve(process.env.UPLOADS_DIR ?? './uploads'),

  async guardar(copropiedadId: string, archivo: Express.Multer.File): Promise<string> {
    const ext = extname(archivo.originalname).toLowerCase();
    if (!PERMITIDOS.includes(ext)) throw new BadRequestException(`Tipo de archivo no permitido: ${ext}`);
    const dir = join(this.raiz(), copropiedadId);
    await mkdir(dir, { recursive: true });
    const nombre = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    await writeFile(join(dir, nombre), archivo.buffer);
    return `${copropiedadId}/${nombre}`;
  },

  async leer(ruta: string): Promise<Buffer> {
    const completa = resolve(this.raiz(), ruta);
    if (!completa.startsWith(this.raiz())) throw new BadRequestException('Ruta inválida');
    return readFile(completa);
  },
};
