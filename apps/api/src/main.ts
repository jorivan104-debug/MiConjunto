import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('Define JWT_SECRET con al menos 32 caracteres en producción');
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()) });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: false } }));
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('Mi Conjunto API').setDescription('Gestión de propiedad horizontal').setVersion('0.1.0').addBearerAuth().build(),
  );
  SwaggerModule.setup('api/docs', app, doc);
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API en http://localhost:${port}/api (documentación en /api/docs)`);
}
bootstrap();
