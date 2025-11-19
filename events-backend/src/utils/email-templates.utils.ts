// src/utils/email-templates.utils.ts

export interface SpeakerCredentialsData {
  salutation?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ExhibitorCredentialsData {
  salutation?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UserCredentialsData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UserQRCodeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  salutation?: string;
  eventName: string;
  eventStartDate?: string | Date; // Event start date for calculating days remaining
  qrCodeCid: string;
  qrCodeBuffer: Buffer;
  qrCodeFilename?: string;
  eventInfoImageCid?: string;
  eventInfoImageBuffer?: Buffer;
  eventInfoImageFilename?: string;
  password?: string; // Optional password for new users
  showCredentials?: boolean; // Flag to show/hide login credentials in email
}

export type EmailTemplatePayload = UserCredentialsData | UserQRCodeEmailData;

export interface RoleSwitchCodeData {
  email: string;
  firstName: string;
  lastName: string;
  code: string;
  fromRole: string;
  toRole: string;
}

export class EmailTemplateUtils {
  /**
   * Generate HTML template for speaker credentials email
   * @param data Speaker credentials data
   * @returns HTML email template
   */
  static generateSpeakerCredentialsTemplate(data: SpeakerCredentialsData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">🎤 Welcome Speaker!</h2>
          <p style="color: #555; font-size: 16px;">
              Dear <strong>${data.firstName} ${data.lastName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px;">
              Welcome to our event platform! Your speaker account has been created successfully. Here are your login credentials:
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
              <h3 style="margin: 0 0 15px 0; color: #004085;">Your Login Credentials</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <div style="margin: 15px 0;">
                  <strong>Password:</strong>
                  <div style="
                      font-size: 18px;
                      font-weight: bold;
                      letter-spacing: 2px;
                      color: #dc3545;
                      background-color: #f8d7da;
                      border: 2px solid #dc3545;
                      padding: 10px 15px;
                      border-radius: 5px;
                      display: inline-block;
                      margin-top: 10px;
                      font-family: monospace;
                  ">
                      ${data.password}
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
              <h4 style="margin: 0 0 10px 0;">🔒 Important Security Notice</h4>
              <p style="margin: 5px 0; font-size: 14px;">
                  For your security, please change your password after your first login.
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                  Never share your credentials with anyone.
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
              <h4 style="margin: 0 0 10px 0;">📋 As a Speaker, you can:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                  <li>Access your speaker dashboard</li>
                  <li>Manage your profile and bio</li>
                  <li>View your assigned events</li>
                  <li>Update event information</li>
                  <li>Interact with event attendees</li>
              </ul>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">
              If you have any questions or need assistance, please contact our support team.
          </p>
          <p style="color: #777; font-size: 12px; text-align: center;">
              Thank you for being part of our event platform! 🎉
          </p>
      </div>
    `;
  }

  /**
   * Generate email options for speaker credentials
   * @param data Speaker credentials data
   * @returns Email options object
   */
  static getSpeakerCredentialsEmailOptions(data: SpeakerCredentialsData) {
    return {
      from: `ISCA Events <${process.env.FROM_EMAIL}>`,
      to: data.email,
      subject: 'Welcome to Our Event Platform - Speaker Account Created',
      html: this.generateSpeakerCredentialsTemplate(data),
    };
  }

  /**
   * Generate HTML template for user credentials email
   * @param data User credentials data
   * @returns HTML email template
   */
  static generateUserCredentialsTemplate(data: UserCredentialsData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">🎉 Welcome to Our Event Platform!</h2>
          <p style="color: #555; font-size: 16px;">
              Dear <strong>${data.firstName} ${data.lastName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px;">
              Welcome to our event platform! Your account has been created successfully by our admin team. Here are your login credentials:
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
              <h3 style="margin: 0 0 15px 0; color: #004085;">🔐 Your Login Credentials</h3>
              <p style="margin: 8px 0; font-size: 16px;">
                  <strong>Email:</strong> ${data.email}
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                  <strong>Password:</strong> <span style="background-color: #004085; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${data.password}</span>
              </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">🔒 Important Security Notice</h4>
              <ul style="margin: 0; padding-left: 20px;">
                  <li>Please change your password after your first login</li>
                  <li>Keep your credentials secure and do not share them</li>
                  <li>Use a strong, unique password for better security</li>
              </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="
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

          <p style="color: #555; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <p style="color: #555; font-size: 14px;">
              Best regards,<br>
              <strong>Event Platform Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.
          </p>
      </div>
    `;
  }

  /**
   * Get email options for user credentials email
   * @param data User credentials data
   * @returns Email options object
   */
  static getUserCredentialsEmailOptions(data: UserCredentialsData) {
    return {
      from: `ISCA Events <${process.env.FROM_EMAIL}>`,
      to: data.email,
      subject: 'Welcome to Our Event Platform - Account Created',
      html: this.generateUserCredentialsTemplate(data),
    };
  }

  /**
   * Generate HTML template for user QR code email
   * @param data User QR code email data
   * @returns HTML email template
   */
  static generateUserQRCodeTemplate(data: UserQRCodeEmailData): string {
    const showCredentials = data.showCredentials && data.password;
    
    // Calculate days remaining until event
    const calculateDaysRemaining = (): string => {
      if (!data.eventStartDate) {
        return 'the countdown is on!';
      }
      
      try {
        const eventDate = new Date(data.eventStartDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          return 'the event has started!';
        } else if (diffDays === 0) {
          return 'the event is today!';
        } else if (diffDays === 1) {
          return 'just 1 more day to go!';
        } else {
          return `just ${diffDays} more days to go!`;
        }
      } catch (error) {
        return 'the countdown is on!';
      }
    };
    
    const daysRemainingText = calculateDaysRemaining();
    
    // Format event date for display (e.g., "12 November")
    const formatEventDate = (): string => {
      if (!data.eventStartDate) {
        return 'the event day';
      }
      
      try {
        const eventDate = new Date(data.eventStartDate);
        const day = eventDate.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[eventDate.getMonth()];
        return `${day} ${month}`;
      } catch (error) {
        return 'the event day';
      }
    };
    
    const formattedEventDate = formatEventDate();
    
    const credentialsSection = showCredentials ? `
          <div style="
              background-color: #e7f3ff;
              border: 1px solid #b3d9ff;
              color: #004085;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
              text-align: center;
          ">
              <h3 style="margin: 0 0 15px 0; color: #004085;">🔐 Your Login Credentials</h3>
              <p style="margin: 8px 0; font-size: 16px;">
                  <strong>Email:</strong> ${data.email}
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                  <strong>Password:</strong> <span style="background-color: #004085; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${data.password}</span>
              </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">🔒 Important Security Notice</h4>
              <ul style="margin: 0; padding-left: 20px;">
                  <li>Please change your password after your first login</li>
                  <li>Keep your credentials secure and do not share them</li>
                  <li>Use a strong, unique password for better security</li>
              </ul>
          </div>
    ` : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
       <h3 style="color: #333; text-align:left;">Get ready for ${data.eventName}</h3>
     
          <p style="color: #555; font-size: 16px;">
              ${
                data.salutation && data.salutation.trim()
                  ? `Dear ${data.salutation.trim()} ${data.lastName},`
                  : `Dear ${data.lastName},`
              }
          </p>

          ${showCredentials ? `
          <p style="color: #555; font-size: 16px;">
              Welcome to our event platform! Your account has been created successfully. Here are your login credentials and event information:
          </p>
          ` : `
          <p style="color: #555; font-size: 16px;">
              <b>${daysRemainingText.charAt(0).toUpperCase() + daysRemainingText.slice(1)} – The countdown to ${data.eventName} is on!</b>
          </p>
          `}

          ${credentialsSection}

          <p style="color: #555; font-size: 16px;">
           The QR code below will be used for your event day registration on ${formattedEventDate}. Please save it and have it ready when you arrive at the venue.
          </p>

              <br>
              <br>
          <div style="
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              padding: 20px;
              margin: 20px auto;
              border-radius: 8px;
              text-align: center;
              max-width: 360px;
          ">
              <h3 style="margin: 0 0 15px 0; color: #333;">Your Event QR Code</h3>
              <img src="cid:${data.qrCodeCid}" alt="Event QR Code" style="width: 100%; max-width: 300px; height: auto; border-radius: 4px; border: 1px solid #ccc;" />
          </div>

         <p style="color: #555; font-size: 16px;">
          For a seamless experience, here are some key details and tips:
         </p>

          <div style="height: 2px;"></div>

          <div style="
              margin: 30px auto 20px;
              max-width: 560px;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #e0e0e0;
          ">
              <img src="https://events.isca.org.sg:3000/image.png" alt="${data.eventName} - What to Expect" style="display: block; width: 100%; height: auto;" />
          </div>

          <div style="height: 2px;"></div>
              
          <p style="color: #555; font-size: 16px;">
             We look forward to hosting you at ${data.eventName}!
          </p>

          <p style="color: #555; font-size: 16px;">
            For any enquiries, contact us at <a href="mailto:membership@isca.org.sg">membership@isca.org.sg</a>.
          </p>

          <p style="color: #555; font-size: 16px;">
             Regards,<br>
              <strong>Terence Lam </strong><br>
              Director<br>
              Advocacy and Professional Standards
          </p>
      </div>
    `;
  }

  /**
   * Get email options for user QR code email
   * @param data User QR code email data
   * @returns Email options object
   */
  static getUserQRCodeEmailOptions(data: UserQRCodeEmailData) {
    return {
      from: `ISCA Events <${process.env.FROM_EMAIL}>`,
      to: data.email,
      subject: `${data.eventName} – Your Registration & Event Guide Inside`,
      html: this.generateUserQRCodeTemplate(data),
      attachments: [
        {
          filename: data.qrCodeFilename || 'event-qr.png',
          content: data.qrCodeBuffer,
          cid: data.qrCodeCid,
          contentType: 'image/png',
        },
        ...(data.eventInfoImageCid && data.eventInfoImageBuffer
          ? [
              {
                filename:
                  data.eventInfoImageFilename ||
                  'isca-conference-2025-what-to-expect.png',
                content: data.eventInfoImageBuffer,
                cid: data.eventInfoImageCid,
                contentType: 'image/png',
              },
            ]
          : []),
      ],
    };
  }

  /**
   * Resolve email options for supported payloads
   * @param data Email payload
   * @returns Email options object
   */
  static getEmailOptions(data: EmailTemplatePayload) {
    // Check for QR code first (has qrCodeBuffer property)
    if ('qrCodeBuffer' in data) {
      return this.getUserQRCodeEmailOptions(data);
    }

    // Otherwise it's a credentials email (has password property and no qrCodeBuffer)
    if ('password' in data && !('qrCodeBuffer' in data)) {
      return this.getUserCredentialsEmailOptions(data as UserCredentialsData);
    }

    throw new Error('Unsupported email template payload');
  }

  /**
   * Generate HTML template for password reset email
   * @param firstName User's first name
   * @param lastName User's last name
   * @param newPassword New temporary password
   * @returns HTML email template
   */
  static generatePasswordResetTemplate(firstName: string, lastName: string, newPassword: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">🔑 Password Reset</h2>
          <p style="color: #555; font-size: 16px;">
              Dear <strong>${firstName} ${lastName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px;">
              Your password has been reset successfully. Here is your new temporary password:
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
              <h3 style="margin: 0 0 15px 0; color: #004085;">Your New Password</h3>
              <div style="margin: 15px 0;">
                  <div style="
                      font-size: 18px;
                      font-weight: bold;
                      letter-spacing: 2px;
                      color: #dc3545;
                      background-color: #f8d7da;
                      border: 2px solid #dc3545;
                      padding: 10px 15px;
                      border-radius: 5px;
                      display: inline-block;
                      font-family: monospace;
                  ">
                      ${newPassword}
                  </div>
              </div>
          </div>

          <div style="
              background-color: #dc3545;
              color: white;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              text-align: center;
          ">
              <h4 style="margin: 0 0 10px 0; color: white;">⚠️ Important!</h4>
              <p style="margin: 5px 0; font-size: 14px;">
                  Please log in and change this password immediately for security reasons.
              </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">
              If you did not request this password reset, please contact our support team immediately.
          </p>
      </div>
    `;
  }

  static getExhibitorCredentialsEmailOptions(data: ExhibitorCredentialsData) {
    return {
      from: `ISCA Events <${process.env.FROM_EMAIL}>`,
      to: data.email,
      subject: 'Welcome to Our Event Platform - Exhibitor Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🏢 Welcome Exhibitor!</h2>
            <p style="color: #555; font-size: 16px;">
                ${
                  data.salutation && data.salutation.trim()
                    ? `Dear <strong>${data.salutation.trim()} ${data.lastName}</strong>,`
                    : `Dear <strong>${data.firstName} ${data.lastName}</strong>,`
                }
            </p>
            <p style="color: #555; font-size: 16px;">
                Welcome to our event platform! Your exhibitor account has been created successfully. Here are your login credentials:
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
                <h3 style="margin: 0 0 15px 0; color: #004085;">Your Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
                <div style="margin: 15px 0;">
                    <strong>Password:</strong>
                    <div style="
                        font-size: 18px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        color: #dc3545;
                        background-color: #f8d7da;
                        border: 2px solid #dc3545;
                        padding: 10px 15px;
                        border-radius: 5px;
                        display: inline-block;
                        margin-top: 10px;
                        font-family: monospace;
                    ">
                        ${data.password}
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
                <h4 style="margin: 0 0 10px 0;">🔒 Important Security Notice</h4>
                <p style="margin: 5px 0; font-size: 14px;">
                    For your security, please change your password after your first login.
                </p>
                <p style="margin: 5px 0; font-size: 14px;">
                    Never share your credentials with anyone.
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
                <h4 style="margin: 0 0 10px 0;">📋 As an Exhibitor, you can:</h4>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                    <li>Access your exhibitor dashboard</li>
                    <li>Manage your company profile and booth information</li>
                    <li>Upload flyers, documents, and event images</li>
                    <li>View your assigned events</li>
                    <li>Create and manage promotional offers</li>
                    <li>Interact with event attendees</li>
                </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #777; font-size: 12px; text-align: center;">
                If you have any questions or need assistance, please contact our support team.
            </p>
            <p style="color: #777; font-size: 12px; text-align: center;">
                Thank you for being part of our event platform! 🎉
            </p>
        </div>
      `,
    };
  }

  /**
   * Generate HTML template for role switch verification email
   * @param data Role switch verification data
   * @returns HTML email template
   */
  static generateRoleSwitchTemplate(data: RoleSwitchCodeData): string {
    const getRoleDisplayName = (role: string) => {
      switch (role.toLowerCase()) {
        case 'user': return 'User';
        case 'exhibitor': return 'Exhibitor';
        case 'speaker': return 'Speaker';
        case 'admin': return 'Administrator';
        default: return role;
      }
    };

    const getRoleIcon = (role: string) => {
      switch (role.toLowerCase()) {
        case 'user': return '👤';
        case 'exhibitor': return '🏢';
        case 'speaker': return '🎤';
        case 'admin': return '⚡';
        default: return '🔄';
      }
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">🔄 Role Switch Verification</h2>
          <p style="color: #555; font-size: 16px;">
              Dear <strong>${data.firstName} ${data.lastName}</strong>,
          </p>
          <p style="color: #555; font-size: 16px;">
              You have requested to switch your role from <strong>${getRoleIcon(data.fromRole)} ${getRoleDisplayName(data.fromRole)}</strong> to <strong>${getRoleIcon(data.toRole)} ${getRoleDisplayName(data.toRole)}</strong>.
          </p>
          <p style="color: #555; font-size: 16px;">
              Please use the verification code below to complete your role switch:
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
              <h3 style="margin: 0 0 15px 0; color: #004085;">Your Verification Code</h3>
              <div style="margin: 15px 0;">
                  <div style="
                      font-size: 24px;
                      font-weight: bold;
                      letter-spacing: 4px;
                      color: #dc3545;
                      background-color: #f8d7da;
                      border: 2px solid #dc3545;
                      padding: 15px 20px;
                      border-radius: 5px;
                      display: inline-block;
                      font-family: monospace;
                  ">
                      ${data.code}
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
              <h4 style="margin: 0 0 10px 0;">⏰ Important!</h4>
              <p style="margin: 5px 0; font-size: 14px;">
                  This verification code will expire in 15 minutes for security reasons.
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                  If you did not request this role switch, please ignore this email.
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
              <h4 style="margin: 0 0 10px 0;">🔒 Security Notice</h4>
              <p style="margin: 5px 0; font-size: 14px;">
                  Please ensure you are switching to the correct role as this action cannot be easily undone.
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                  Never share this verification code with anyone.
              </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">
              If you have any questions or need assistance, please contact our support team.
          </p>
          <p style="color: #777; font-size: 12px; text-align: center;">
              Thank you for using our event platform! 🎉
          </p>
      </div>
    `;
  }

  /**
   * Generate email options for role switch verification
   * @param data Role switch verification data
   * @returns Email options object
   */
  static getRoleSwitchEmailOptions(data: RoleSwitchCodeData) {
    return {
      from: `ISCA Events <${process.env.FROM_EMAIL}>`,
      to: data.email,
      subject: 'Role Switch Verification Code - Event Platform',
      html: this.generateRoleSwitchTemplate(data),
    };
  }


     /**
     * Generate HTML email template for booth code notification
     */
     static generateBoothCodeEmail(
        uniqueCode: string,
        eventName: string,
        eventStartDate: string,
        eventVenue: string,
      ): string {
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin-bottom: 10px;">Event Booth Access Code</h1>
              <p style="color: #7f8c8d; font-size: 16px;">You have been assigned a booth for an upcoming event</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Event Details</h2>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Event Name:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventName}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Date:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventStartDate}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Venue:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventVenue || 'To be announced'}</span>
              </div>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; margin-bottom: 25px; text-align: center;">
              <h3 style="color: #27ae60; margin-bottom: 15px;">Your Unique Booth Code</h3>
              <div style="background-color: #27ae60; color: white; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 15px 0;">
                ${uniqueCode}
              </div>
              <p style="color: #2c3e50; margin: 0;">Keep this code safe - you'll need it to access your booth</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin-bottom: 15px;">📱 How to Activate This Code in the App</h3>
              <ol style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Open the event app on your mobile device</li>
                <li>Go to the "Booth Management" or "Exhibitor" section</li>
                <li>Enter your unique booth code: <strong>${uniqueCode}</strong></li>
                <li>Follow the on-screen instructions to activate your booth</li>
                <li>Once activated, you can manage your booth information and materials</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #7f8c8d; margin-bottom: 10px;">If you have any questions or need assistance, please contact the event organizers.</p>
              <p style="color: #7f8c8d; font-size: 14px;">Thank you for participating in our event!</p>
            </div>
          </div>
        `;
      }
    
      /**
       * Generate HTML email template for event registration confirmation
       */
      static generateEventRegistrationEmail(
        eventName: string,
        eventStartDate: string,
        eventVenue: string,
        userName: string,
      ): string {
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin-bottom: 10px;">Event Registration Confirmed</h1>
              <p style="color: #7f8c8d; font-size: 16px;">Your registration has been successfully confirmed</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Event Details</h2>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Event Name:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventName}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Date:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventStartDate}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Venue:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventVenue || 'To be announced'}</span>
              </div>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; margin-bottom: 25px; text-align: center;">
              <h3 style="color: #27ae60; margin-bottom: 15px;">Registration Confirmed</h3>
              <p style="color: #2c3e50; margin: 0;">Hello ${userName}, your registration for this event has been confirmed!</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #7f8c8d; margin-bottom: 10px;">We look forward to seeing you at the event!</p>
              <p style="color: #7f8c8d; font-size: 14px;">If you have any questions, please contact the event organizers.</p>
            </div>
          </div>
        `;
      }
    
      /**
       * Generate HTML email template for password reset
       */
      static generatePasswordResetEmail(
        resetToken: string,
        userName: string,
      ): string {
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin-bottom: 10px;">Password Reset Request</h1>
              <p style="color: #7f8c8d; font-size: 16px;">You requested to reset your password</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin-bottom: 15px;">Reset Your Password</h3>
              <p style="color: #856404; margin-bottom: 15px;">Hello ${userName},</p>
              <p style="color: #856404; margin-bottom: 15px;">Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h3 style="color: #2c3e50; margin-bottom: 15px;">Important Notes</h3>
              <ul style="color: #2c3e50; margin: 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #7f8c8d; margin-bottom: 10px;">If you have any questions, please contact our support team.</p>
            </div>
          </div>
        `;
      }
    
      /**
       * Generate HTML email template for booth removal notification
       */
      static generateBoothRemovalEmail(
        eventName: string,
        eventStartDate: string,
        eventVenue: string,
        uniqueCode: string,
      ): string {
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e74c3c; margin-bottom: 10px;">Booth Access Revoked</h1>
              <p style="color: #7f8c8d; font-size: 16px;">Your booth access for this event has been removed</p>
            </div>
            
            <div style="background-color: #fdf2f2; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #e74c3c;">
              <h2 style="color: #c0392b; margin-bottom: 20px;">Important Notice</h2>
              <p style="color: #2c3e50; margin-bottom: 15px;">Your booth access for the following event has been revoked:</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Event Details</h2>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Event Name:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventName}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #34495e;">Date:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventStartDate}</span>
              </div>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <strong style="color: #34495e;">Venue:</strong>
                <span style="color: #2c3e50; margin-left: 10px;">${eventVenue || 'To be announced'}</span>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin-bottom: 15px;">⚠️ Booth Code No Longer Valid</h3>
              <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 15px 0; text-align: center; border: 1px solid #f5c6cb;">
                ${uniqueCode}
              </div>
              <p style="color: #856404; margin: 0; text-align: center;"><strong>This booth code is no longer active and cannot be used.</strong></p>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h3 style="color: #27ae60; margin-bottom: 15px;">What This Means</h3>
              <ul style="color: #2c3e50; margin: 0; padding-left: 20px;">
                <li>You no longer have access to a booth at this event</li>
                <li>The booth code ${uniqueCode} is no longer valid</li>
                <li>You cannot use this code to access booth management features</li>
                <li>If you believe this is an error, please contact the event organizers</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #7f8c8d; margin-bottom: 10px;">If you have any questions about this change, please contact the event organizers.</p>
              <p style="color: #7f8c8d; font-size: 14px;">Thank you for your understanding.</p>
            </div>
          </div>
        `;
      }
}



  