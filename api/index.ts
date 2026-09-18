import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';

const server = express();

export const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Static Assets (Ephemeral on Vercel)
  const uploadsDir = path.resolve(process.cwd(), 'backend', 'uploads');
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  await app.init();
};

let promise: Promise<void>;

export default async function handler(req: any, res: any) {
  if (!promise) {
    promise = createNestServer(server);
  }
  await promise;
  server(req, res);
}
