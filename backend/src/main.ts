import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as cookieParser from 'cookie-parser';
import { ClientTypeInterceptor } from './common/interceptors/client-type.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    forceCloseConnections: true,
  });
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const NODE_ENV = configService.get<string>('NODE_ENV');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClientTypeInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      enableDebugMessages: NODE_ENV === 'development',
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, // for using transform for dtos
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
