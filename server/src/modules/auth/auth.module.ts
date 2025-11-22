import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { MailService } from './mail/mail.service';
import { OtpService } from './mail/otp.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.get('jwt');
        return {
          secret: jwt?.secret,
          signOptions: { expiresIn: jwt?.expiresIn },
        };
      },
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, OtpService],
})
export class AuthModule {}
