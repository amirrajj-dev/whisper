import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';

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
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
