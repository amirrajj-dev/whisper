import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  private redisClient: Redis;

  constructor(
    @InjectConnection() private mongooseConnection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis(this.configService.get('REDIS_URL') as string);
  }

  async check() {
    const dbState =
      this.mongooseConnection.readyState === ConnectionStates.connected;
    let redisState = false;
    try {
      const ping = await this.redisClient.ping();
      redisState = ping === 'PONG';
    } catch {
      redisState = false;
    }

    return {
      status: dbState && redisState ? 'ok' : 'degraded',
      mongodb: dbState ? 'up' : 'down',
      redis: redisState ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
