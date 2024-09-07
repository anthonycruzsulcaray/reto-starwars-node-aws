import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { Server } from 'http';
import { AppModule } from '../../app.module';
import { INestApplication } from '@nestjs/common'
import { Handler, Context, Callback } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import express from 'express';
const binaryMimeTypes: string[] = [];
let cachedServer: Server;


async function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
     .setTitle('API de Películas')
     .setDescription('Documentación de la API de Películas')
     .setVersion('1.0')
     .addTag('peliculas')
     .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
     try {
        const expressApp = express();
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { cors: true })
        nestApp.use(eventContext());
        // nestApp.setGlobalPrefix('starwars-api')
        // Enable swagger
        setupSwagger(nestApp)
        await nestApp.init();
        cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
     } catch (error) {
        return Promise.reject(error);
     }
  }
  return cachedServer;
}
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer;
};
