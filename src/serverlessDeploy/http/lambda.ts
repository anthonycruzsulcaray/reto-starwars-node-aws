import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { Server } from 'http';
import { AppModule } from '../../app.module';
import { INestApplication } from '@nestjs/common'
import { Handler, Context } from 'aws-lambda';
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
  SwaggerModule.setup('swagger', app, document);
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

export const handler: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrapServer();
  console.log("REQUEST::", JSON.stringify(event))
  console.log("REQUEST::RESOURCE::", event.resource)
  console.log("REQUEST::pathParameters::", event.pathParameters)
  if (event.body && getContentType(event)) {
    //event.body = (Buffer.from(event.body, 'binary') as unknown) as string;  
    console.log("REQUEST::BODY::", 'binary')
  } else {
    console.log("REQUEST::BODY::", event.body)
  }
  const response = await proxy(cachedServer, event, context, 'PROMISE').promise;
  console.log("REPONSE::", JSON.stringify(response))
  return response
}

function getContentType(event: any) {
  try {
    return event.headers['Content-Type'].includes('multipart/form-data')
  } catch (error) {
    return event.headers['content-type'].includes('multipart/form-data')
  }
}
