// src/utils/email-templates.utils.ts

export interface SpeakerCredentialsData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ExhibitorCredentialsData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

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
      from: process.env.SMTP_USER,
      to: data.email,
      subject: 'Welcome to Our Event Platform - Speaker Account Created',
      html: this.generateSpeakerCredentialsTemplate(data),
    };
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
      from: process.env.SMTP_USER,
      to: data.email,
      subject: 'Welcome to Our Event Platform - Exhibitor Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">🏢 Welcome Exhibitor!</h2>
            <p style="color: #555; font-size: 16px;">
                Dear <strong>${data.firstName} ${data.lastName}</strong>,
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
      from: process.env.SMTP_USER,
      to: data.email,
      subject: 'Role Switch Verification Code - Event Platform',
      html: this.generateRoleSwitchTemplate(data),
    };
  }
}
