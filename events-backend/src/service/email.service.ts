import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail', // Use your email service
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  async sendOTP(email: string,firstName: string, lastName: string, otp: string): Promise<string> {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">One-Time Password (OTP)</h2>
            <p style="color: #555; font-size: 16px;">
                Dear ${firstName} ${lastName},
            </p>
            <p style="color: #555; font-size: 16px;">
                Your OTP code is:
            </p>
            <div style="text-align: center; margin: 20px;">
                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #2d89ef;
                    background-color: #f0f7ff;
                    border: 2px dashed #2d89ef;
                    padding: 15px 25px;
                    border-radius: 5px;
                    display: inline-block;
                ">
                    ${otp}
                </div>
            </div>
            <p style="color: #555; font-size: 16px;">
                This OTP is valid for the next <strong>10 minutes</strong>. If you did not request this, please ignore this email or contact support.
            </p>
            
            <div style="
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
                text-align: center;
            ">
                For security: Never share this OTP with anyone.
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #777; font-size: 12px; text-align: center;">
                If you have any questions, feel free to reach out to our support team.
            </p>
        </div>
        `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}: ${otp}`);
      return otp;
    } catch (error) {
      throw new Error('Failed to send OTP');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, lastName: string, otp: string): Promise<string> {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Our Event Platform - Verify Your Email',
      text: `Welcome ${firstName} ${lastName}! Please verify your email with OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🎉 Welcome to Our Event Platform!</h2>
            <p style="color: #555; font-size: 16px;">
                Dear <strong>${firstName} ${lastName}</strong>,
            </p>
            <p style="color: #555; font-size: 16px;">
                Welcome to our event platform! We're excited to have you on board. To complete your registration, please verify your email address using the OTP below.
            </p>
            
            <div style="text-align: center; margin: 20px;">
                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #2d89ef;
                    background-color: #f0f7ff;
                    border: 2px dashed #2d89ef;
                    padding: 15px 25px;
                    border-radius: 5px;
                    display: inline-block;
                ">
                    ${otp}
                </div>
            </div>

            <div style="
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                text-align: center;
            ">
                <h3 style="margin: 0; color: #155724;">✅ Account Created Successfully</h3>
                <p style="margin: 10px 0 0 0; font-size: 14px;">
                    Your account has been created and is ready for verification!
                </p>
            </div>

            <div style="
                background-color: #e7f3ff;
                border: 1px solid #b3d9ff;
                color: #004085;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
            ">
                <strong>What happens after verification:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Access to all platform features</li>
                    <li>Browse and register for events</li>
                    <li>Manage your event registrations</li>
                    <li>Receive event updates and notifications</li>
                </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #777; font-size: 12px; text-align: center;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            <p style="color: #777; font-size: 12px; text-align: center;">
                Welcome aboard! 🚀
            </p>
        </div>
        `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}: ${firstName} ${lastName}`);
      return 'Welcome email sent successfully';
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}
