import { Module } from '@nestjs/common';
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
        SIGN_UP_JWT_EXPIRES_IN: Joi.string().default('1h'),
        LOGIN_JWT_EXPIRES_IN: Joi.string().default('15d'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_URL!),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          transport:
            config.get<string>('NODE_ENV', 'development') === 'development'
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
                      target: 'pino/file',
                      level: 'info',
                      options: { destination: './logs/app.log', mkdir: true },
                    },
                    {
                      target: 'pino/file',
                      level: 'error',
                      options: { destination: './logs/error.log', mkdir: true },
                    },
                  ],
                },
        },
      }),
    }),
    UserModule,
    ChatModule,
    NotificationModule,
    AuthModule,
    GatewayModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
