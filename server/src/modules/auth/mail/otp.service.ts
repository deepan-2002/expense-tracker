import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private readonly otpStore = new Map<
    string,
    { otp: string; expires: number }
  >();

  generateOtp(email: string): string {
    const otp = randomInt(100000, 999999).toString();
    this.otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    });
    return otp;
  }

  verifyOtp(email: string, otp: string): boolean {
    const record = this.otpStore.get(email);
    if (!record || record.otp !== otp) {
      throw new UnauthorizedException('Incorrect OTP');
    } else if (Date.now() > record.expires) {
      throw new UnauthorizedException('OTP Expired');
    }
    this.otpStore.delete(email);
    return true;
  }
}
