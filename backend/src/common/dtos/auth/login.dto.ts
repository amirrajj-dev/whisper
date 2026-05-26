import { SignupDto } from './signup.dto';
import { PickType } from '@nestjs/mapped-types';

export class LoginDto extends PickType(SignupDto, ['email', 'password']) {}
