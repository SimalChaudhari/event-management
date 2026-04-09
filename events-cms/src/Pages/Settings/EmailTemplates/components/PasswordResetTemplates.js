// Password Reset Template Variations
export const passwordResetTemplates = [
    {
        id: 'password-reset-otp',
        name: 'Password Reset OTP',
        description: 'OTP-based password reset',
        icon: 'feather icon-key',
        type: 'password-reset',
        subject: 'Reset Your Password',
        templateKey: 'otp-table'
    },
    {
        id: 'password-reset-link',
        name: 'Password Reset Link',
        description: 'Reset link email',
        icon: 'feather icon-link',
        type: 'password-reset',
        subject: 'Reset Your Password',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 30px 20px; text-align: center; background-color: #dc3545;">
            <h2 style="color: #ffffff; font-size: 24px; margin: 0;">Password Reset Request</h2>
        </td>
    </tr>
    <tr>
        <td style="padding: 30px 20px;">
            <p style="color: #333333; font-size: 16px; margin: 0 0 15px 0;">Hello {{firstName}},</p>
            <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" style="background-color: #dc3545; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #777777; font-size: 13px; margin: 20px 0 0 0;">
                If you didn't request this, please ignore this email. This link will expire in 24 hours.
            </p>
        </td>
    </tr>
</table>`,
        preview: '#dc3545'
    }
];

