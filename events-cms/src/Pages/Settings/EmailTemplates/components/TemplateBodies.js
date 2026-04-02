// Template Body Definitions
export const getTemplateBody = (templateKey) => {
    const templateBodies = {
        'credentials-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">🎉 Welcome to Our Event Platform!</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Dear <strong style="color: #333333;">{{firstName}} {{lastName}}</strong>,
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        Welcome to our event platform! Your account has been created successfully by our admin team. Here are your login credentials:
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff; border-radius: 8px;">
                            <tr>
                                <td style="padding: 20px; background-color: #e7f3ff;">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td style="text-align: center; padding-bottom: 15px;">
                                                <h3 style="margin: 0; color: #004085; font-size: 18px; font-weight: bold;">🔑 Your Login Credentials</h3>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff;">
                                                    <tr>
                                                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #004085; width: 30%; background-color: #ffffff;">Email:</td>
                                                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff;">
                                                            <a href="mailto:{{email}}" style="color: #007bff; text-decoration: none;">{{email}}</a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px; font-weight: bold; color: #004085; background-color: #ffffff;">Password:</td>
                                                        <td style="padding: 12px; background-color: #ffffff;">
                                                            <div style="background-color: #f8f9fa; border: 1px solid #b3d9ff; padding: 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 14px; letter-spacing: 2px; color: #004085; word-break: break-all;">
                                                                {{password}}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #ffeeba; border-radius: 5px;">
                            <tr>
                                <td style="padding: 15px; background-color: #fff3cd;">
                                    <h4 style="margin: 0 0 10px 0; color: #856404; text-align: center; font-size: 16px; font-weight: bold;">⚠️ Important Security Notice</h4>
                                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #856404;">
                                        <li style="padding-bottom: 5px;">Please change your password after your first login</li>
                                        <li style="padding-bottom: 5px;">Keep your credentials secure and do not share them</li>
                                        <li>Use a strong, unique password for better security</li>
                                    </ul>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <a href="#" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">Login to Your Account</a>
                    </td>
                </tr>
                <tr>
                    <td style="border-top: 1px solid #dddddd; padding-top: 20px; padding-bottom: 10px;">
                        <p style="color: #777777; font-size: 12px; text-align: center; margin: 0;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.<br>
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
                <tr>
                    <td>
                        <p style="color: #999999; font-size: 11px; text-align: center; margin: 0;">
                            This is an automated email. Please do not reply to this message.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
        'info-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">Event Registration Details</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Dear {{userName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        Your registration details are as follows:
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #dddddd;">
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; width: 40%; color: #333333; background-color: #f8f9fa;">Event Name:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #f8f9fa;">{{eventName}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #ffffff;">Registration Date:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #ffffff;">{{registrationDate}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #f8f9fa;">Email:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #f8f9fa;">{{email}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #ffffff;">Status:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #28a745; font-weight: bold; background-color: #ffffff;">Confirmed</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-top: 20px;">
                        <p style="color: #555555; font-size: 14px; margin: 0;">
                            Thank you for registering!<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
        'otp-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">🔐 Email Verification</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Hello {{firstName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 30px;">
                        Please use the OTP below to verify your email address:
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <table cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #f0f7ff; border: 2px dashed #2d89ef; border-radius: 8px;">
                            <tr>
                                <td style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2d89ef; background-color: #f0f7ff; padding: 20px 30px; font-family: 'Courier New', Courier, monospace;">
                                    {{otp}}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #ffeeba;">
                            <tr>
                                <td style="padding: 15px; text-align: center; color: #856404; background-color: #fff3cd;">
                                    <strong style="font-size: 14px;">⚠️ This OTP is valid for 10 minutes only</strong><br>
                                    <span style="font-size: 12px;">If you didn't request this, please ignore this email.</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-top: 20px;">
                        <p style="color: #777777; font-size: 12px; margin: 0;">
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`
    };
    return templateBodies[templateKey] || '';
};

