import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

// add isMobile property to Request interface
declare module 'express' {
  export interface Request {
    isMobile?: boolean;
  }
}

@Injectable()
export class ClientTypeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || '';
    request.isMobile = /mobile|android|iphone/i.test(userAgent);
    return next.handle();
  }
}
