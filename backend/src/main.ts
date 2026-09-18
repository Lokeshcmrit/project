import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS (origin: true reflects request origin — required when credentials: true)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global DTO Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Static Assets for Photos & SVGs
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`=======================================================`);
  console.log(`🚆 RailSync AI Backend Service is running on port ${port}`);
  console.log(`📡 Socket.io Gateway active on ws://localhost:${port}`);
  console.log(`📸 Serving uploaded photos from: ${uploadsDir}`);
  console.log(`=======================================================`);
}

bootstrap();
