import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SanitizedUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MailService } from './mail/mail.service';
import { OtpService } from './mail/otp.service';

type JwtConfig = {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user.id, user.username, user.email);
    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found for this email');
    }
    const isValid = await this.validatePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect password');
    }
    const tokens = await this.generateTokens(
      user.id,
      user.username || user.email,
      user.email,
    );
    return {
      user: this.usersService.toSafeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const jwtConfig = this.getJwtConfig();
    let payload: { sub: string | number; username: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = this.normalizeUserId(payload.sub);
    if (userId === null) {
      throw new UnauthorizedException('Invalid token-user pair');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token-user pair');
    }

    return this.generateTokens(user.id, user.username || user.email, user.email);
  }

  async logout(userPayload: any, refreshToken: string) {
    if (!userPayload?.sub && !userPayload?.id) {
      throw new UnauthorizedException();
    }

    const jwtConfig = this.getJwtConfig();
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });
      const tokenUserId = this.normalizeUserId(payload.sub);
      const requestUserId = this.normalizeUserId(
        userPayload.id ?? userPayload.sub ?? userPayload.userId,
      );
      if (
        tokenUserId === null ||
        requestUserId === null ||
        tokenUserId !== requestUserId
      ) {
        throw new ForbiddenException('Token does not belong to this user');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { message: 'Logged out successfully' };
  }

  async me(userPayload: any) {
    const userId = this.normalizeUserId(userPayload?.id ?? userPayload?.sub);
    return this.usersService.getProfile({
      id: userId ?? undefined,
      username: userPayload?.username,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          'If an account exists with this email, a password reset OTP has been sent.',
      };
    }

    // Generate OTP
    const otp = this.otpService.generateOtp(email);

    // Send OTP via email
    try {
      await this.mailService.sendOtp(email, otp);
    } catch (error) {
      // Log error but don't reveal to user
      console.error('Failed to send OTP email:', error);
    }

    // Always return the same message for security
    return {
      message:
        'If an account exists with this email, a password reset OTP has been sent.',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    // Verify OTP
    try {
      this.otpService.verifyOtp(email, otp);
      return { message: 'OTP verified successfully', verified: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, password } = resetPasswordDto;

    // Verify OTP first
    try {
      this.otpService.verifyOtp(email, otp);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password
    await this.usersService.updatePassword(email, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  private async validatePassword(plainPassword: string, hashPassword: string) {
    return await bcrypt.compare(plainPassword, hashPassword);
  }

  private async generateTokens(
    userId: number,
    username: string | null,
    email: string,
  ) {
    const jwtConfig = this.getJwtConfig();
    const payload = { sub: userId, username: username || email, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private getJwtConfig(): JwtConfig {
    const config = this.configService.get<JwtConfig>('jwt');
    if (!config) {
      throw new Error('JWT config not provided');
    }
    return config;
  }

  private normalizeUserId(id: unknown): number | null {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }
}
