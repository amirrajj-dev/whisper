import { Module, OnApplicationShutdown } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { GatewayModule } from './gateway/gateway.module';
import { UploadModule } from './upload/upload.module';
import { LoggerModule } from 'nestjs-pino';
import mongoose from 'mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HealthModule } from './health/health.module';
import { HealthService } from './health/health.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        MONGO_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
        REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('30d'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        CORS_ORIGIN: Joi.string().default('*'),
        THROTTLE_TTL: Joi.number().required().default(60000),
        THROTTLE_LIMIT: Joi.number().required().default(10),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        EMAIL_HOST: Joi.string().required(),
        EMAIL_USERNAME: Joi.string().required(),
        EMAIL_PASSWORD: Joi.string().required(),
        EMAIL_PORT: Joi.string().required(),
        EMAIL_FROM: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_URL!, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          transport:
            config.get<string>('NODE_ENV') === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    singleLine: true,
                  },
                }
              : {
                  targets: [
                    {
                      target: 'pino-roll',
                      level: 'info',
                      options: {
                        file: './logs/app.log',
                        frequency: 'daily',
                        size: '10m',
                        mkdir: true,
                        limit: { count: 14 }, // Keep 14 days of info logs
                      },
                    },
                    {
                      target: 'pino-roll',
                      level: 'error',
                      options: {
                        file: './logs/error.log',
                        frequency: 'daily',
                        size: '10m',
                        mkdir: true,
                        limit: { count: 30 }, // Keep 30 days of error logs
                      },
                    },
                  ],
                },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get<number>('THROTTLE_TTL')),
            limit: Number(config.get<number>('THROTTLE_LIMIT')),
          },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis(process.env.REDIS_URL as string),
        ),
      }),
    }),
    UserModule,
    ChatModule,
    NotificationModule,
    AuthModule,
    GatewayModule,
    UploadModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('EMAIL_HOST'),
          port: config.get<number>('EMAIL_PORT', 587),
          secure: false, // true for port 465
          auth: {
            user: config.get<string>('EMAIL_USERNAME'),
            pass: config.get<string>('EMAIL_PASSWORD'),
          },
        },
      }),
    }),
    MailModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnApplicationShutdown {
  async onApplicationShutdown(signal: string) {
    console.log(`Shutdown signal: ${signal}`);
    const timeout = setTimeout(() => {
      console.error('Forced shutdown timeout');
      process.exit(1);
    }, 10000);

    await mongoose.disconnect();
    clearTimeout(timeout);
  }
}
