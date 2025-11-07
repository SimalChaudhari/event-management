import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const transportOptions: nodemailer.TransportOptions = {
      host,
      port,
      secure,
    } as nodemailer.TransportOptions;

    if (user && pass) {
      (transportOptions as any).auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
// this.transporter = nodemailer.createTransport({
//     service: 'Gmail', // Use your email service
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

  }

  async sendModeratorAssignmentEmail(
    email: string,
    moderatorName: string,
    assignments: any[],
    landingUrl: string,
    accessToken: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Event Assignment - Moderator Access',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🎯 Event Assignment Notification</h2>
            <p style="color: #555; font-size: 16px;">
                Dear <strong>${moderatorName}</strong>,
            </p>
            <p style="color: #555; font-size: 16px;">
                You have been assigned as a moderator for the following events and sessions:
            </p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
                ${assignments.map(assignment => `
                    <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;">
                        <h3 style="color: #007bff; margin: 0 0 10px 0;">
                            📅 ${assignment.event?.name || 'Unknown Event'}
                        </h3>
                        ${assignment.track ? `
                            <p style="color: #6c757d; margin: 5px 0;">
                                <strong>Track:</strong> ${assignment.track.title} (ID: ${assignment.trackId})
                            </p>
                        ` : ''}
                        ${assignment.sessions && assignment.sessions.length > 0 ? `
                            <div style="margin: 10px 0;">
                                <strong style="color: #495057;">Sessions (${assignment.sessions.length}):</strong>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    ${assignment.sessions.map((sessionItem: any) => `
                                        <li style="color: #6c757d; margin: 3px 0;">
                                            <strong>${sessionItem.session?.title || 'Unknown Session'}</strong> (ID: ${sessionItem.id})
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <p style="color: #555; font-size: 16px;">
                <strong>🚀 Access Your Moderator Dashboard:</strong>
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${landingUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🎛️ Access Moderator Dashboard
                </a>
            </div>
            <p style="color: #555; font-size: 16px;">
                Click the button above to access your moderator dashboard where you can:
            </p>
            <ul style="color: #555; font-size: 16px; padding-left: 20px;">
                <li>View and answer questions from participants</li>
                <li>Manage Q&A sessions in real-time</li>
                <li>Monitor engagement and participation</li>
                <li>Access session-specific data and statistics</li>
            </ul>
            
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #333; margin-bottom: 15px;">🔑 Your Access Token</h4>
                <p style="color: #555; font-size: 16px; margin-bottom: 10px;">
                    <strong>Token:</strong>
                </p>
                <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6; word-break: break-all; font-family: monospace; font-size: 12px;">
                    ${accessToken}
                </div>
                <p style="color: #555; font-size: 14px; font-style: italic; margin-top: 10px;">
                    Use this token in API calls to access all event details, engagement data, and Q&A information. Include it in the Authorization header as "Bearer [token]".
                </p>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                <h4 style="color: #155724; margin: 0 0 10px 0;">✅ Direct Access</h4>
                <p style="color: #155724; margin: 0; font-size: 14px;">
                    No login required! Use the button above or the token for immediate access to your moderator dashboard.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                    If you have any questions, please contact the event administrator.
                </p>
            </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendModeratorSessionAssignmentEmail(
    email: string,
    moderatorName: string,
    assignmentData: any,
    landingUrl: string,
    accessToken: string
  ): Promise<void> {
    const { moderator, event, track, session, questions } = assignmentData;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: `Session Assignment - ${session.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🎯 Session Assignment Notification</h2>
            <p style="color: #555; font-size: 16px;">
                Dear <strong>${moderatorName}</strong>,
            </p>
            <p style="color: #555; font-size: 16px;">
                You have been assigned as a moderator for the session
            </p>
                        
            <p style="color: #555; font-size: 16px;">
                <strong>🚀 Access Your Session Dashboard:</strong>
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${landingUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🎛️ Access Session Dashboard
                </a>
            </div>
            <p style="color: #555; font-size: 16px;">
                Click the button above to access your session dashboard where you can:
            </p>
            <ul style="color: #555; font-size: 16px; padding-left: 20px;">
                <li>View and answer questions from participants</li>
                <li>Manage Q&A sessions in real-time</li>
                <li>Pin important questions</li>
                <li>Monitor engagement and participation</li>
                <li>Access session-specific data and statistics</li>
            </ul>
            
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #333; margin-bottom: 15px;">🔑 Your Access Token</h4>
                <p style="color: #555; font-size: 16px; margin-bottom: 10px;">
                    <strong>Token:</strong>
                </p>
                <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6; word-break: break-all; font-family: monospace; font-size: 12px;">
                    ${accessToken}
                </div>
                <p style="color: #555; font-size: 14px; font-style: italic; margin-top: 10px;">
                    Use this token in API calls to access session details, questions, and Q&A management. Include it in the Authorization header as "Bearer [token]".
                </p>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                <h4 style="color: #155724; margin: 0 0 10px 0;">✅ Direct Access</h4>
                <p style="color: #155724; margin: 0; font-size: 14px;">
                    No login required! Use the button above or the token for immediate access to your session dashboard.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                    If you have any questions, please contact the event administrator.
                </p>
            </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOTP(email: string,firstName: string, lastName: string, otp: string): Promise<string> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
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
    
      return otp;
    } catch (error) {
      throw new Error('Failed to send OTP');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, lastName: string, otp: string): Promise<string> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
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
  
      return 'Welcome email sent successfully';
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async sendExhibitorCredentials(
    email: string, 
    firstName: string, 
    lastName: string, 
    password: string
  ): Promise<string> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Welcome as Exhibitor - Your Account Credentials',
      text: `Welcome ${firstName} ${lastName}! Your exhibitor account has been created. Email: ${email}, Password: ${password}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🎪 Welcome as an Exhibitor!</h2>
            <p style="color: #555; font-size: 16px;">
                Dear <strong>${firstName} ${lastName}</strong>,
            </p>
            <p style="color: #555; font-size: 16px;">
                Congratulations! Your exhibitor account has been successfully created on our event platform. Below are your login credentials:
            </p>
            
            <div style="
                background-color: #e7f3ff;
                border: 1px solid #b3d9ff;
                color: #004085;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: center;
            ">
                <h3 style="margin: 0 0 15px 0; color: #004085;">🔑 Your Login Credentials</h3>
                <div style="margin: 10px 0;">
                    <strong>Email:</strong> 
                    <div style="
                        background-color: #fff;
                        border: 1px solid #b3d9ff;
                        padding: 8px;
                        margin: 5px 0;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 14px;
                    ">
                        ${email}
                    </div>
                </div>
                <div style="margin: 10px 0;">
                    <strong>Password:</strong>
                    <div style="
                        background-color: #fff;
                        border: 1px solid #b3d9ff;
                        padding: 8px;
                        margin: 5px 0;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 14px;
                        letter-spacing: 2px;
                    ">
                        ${password}
                    </div>
                </div>
            </div>

            <div style="
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                text-align: center;
            ">
                <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Important Security Notice</h4>
                <p style="margin: 0; font-size: 14px;">
                    Please change your password after your first login for enhanced security.
                </p>
            </div>

            <div style="
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            ">
                <h4 style="margin: 0 0 10px 0; color: #155724;">🚀 What you can do as an Exhibitor:</h4>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                    <li>Create and manage your exhibitor profile</li>
                    <li>Upload flyers, documents, and event images</li>
                    <li>Participate in events and showcase your business</li>
                    <li>Connect with event attendees and other exhibitors</li>
                    <li>Access event management tools and analytics</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="
                    background-color: #007bff;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    display: inline-block;
                ">
                    Login to Your Account
                </a>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #777; font-size: 12px; text-align: center;">
                If you have any questions or need assistance setting up your exhibitor profile, please contact our support team.
            </p>
            <p style="color: #777; font-size: 12px; text-align: center;">
                Welcome to the exhibitor community! 🎉
            </p>
        </div>
        `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
   
      return 'Exhibitor credentials sent successfully';
    } catch (error) {
      console.error('Failed to send exhibitor credentials:', error);
      throw new Error('Failed to send exhibitor credentials');
    }
  }

  async sendEmail(email: string, subject: string, html: string): Promise<string> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      
      return 'Email sent successfully';
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}
