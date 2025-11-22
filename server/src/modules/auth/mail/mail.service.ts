// mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendOtp(email: string, otp: string) {
    const htmlTemplate = fs
      .readFileSync('src/templates/otp-template.html', 'utf-8')
      .replace('{{OTP}}', otp);

    await this.transporter.sendMail({
      from: `"MyApp Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code (valid for 5 minutes)',
      html: htmlTemplate,
    });
  }
}
