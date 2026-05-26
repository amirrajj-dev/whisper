import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RestrictEmailDomainPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}
  transform(value: { email: string }) {
    const allowedDomains = this.configService.get<string[]>(
      'ALLOWED_EMAIL_DOMAINS',
      ['gmail.com'],
    );
    if (!value.email || typeof value.email !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }
    const emailDomain = value.email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      throw new BadRequestException(
        `Email domain must be one of the following: ${allowedDomains.join(', ')}`,
      );
    }
    return value;
  }
}
